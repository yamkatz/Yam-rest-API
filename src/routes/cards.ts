import { Router } from "express";
import { isBusiness } from "../middleware/is-business";
import { validateCard } from "../middleware/validation";
import { createCard } from "../service/card-service";
import { ICardInput } from "../@types/card";
import { BizCardsError } from "../error/biz-cards-error";
import { Card } from "../database/model/card";
import { validateToken } from "../middleware/validate-token";
import { Logger } from "../logs/logger";
import { isAdminOrCardCreator } from "../middleware/is-admin-or-cardCreator";
import { isAdmin } from "../middleware/is-admin";
import { error } from "winston";

const router = Router();

//body + JWT(userID)
router.post("/", isBusiness, validateCard, async (req, res, next) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      Logger.error("User must have an id", 500, error);
      throw new BizCardsError("User must have an id", 500);
    }

    const savedCard = await createCard(req.body as ICardInput, userId);

    res.json({ card: savedCard });
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req, res, next) => {
  try {
    //move to service
    const allCards = await Card.find();
    return res.json(allCards);
  } catch (e) {
    next(e);
  }
});

router.get("/my-cards", validateToken, async (req, res, next) => {
  try {
    const userId = req.user?._id!;

    const cards = await Card.find({ userId });

    return res.json(cards);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const card = await Card.findById(id);

    if (!card) {
      Logger.error("Card not found", 404, error);
      return res.status(404).json({ message: "Card not found" });
    }

    return res.json(card);
  } catch (e) {
    next(e);
  }
});

router.put("/:id", validateToken, validateCard, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const cardId = req.params.id;

    const editCard = await Card.findOneAndUpdate(
      { _id: cardId, userId },
      req.body,
      { new: true }
    );

    if (!editCard) {
      throw new BizCardsError(
        "Unauthorized: You are not the creator of this card",
        403
      );
    }

    res.json({ card: editCard });
  } catch (e) {
    Logger.error("Internal Server Error", 500, error);
    next(e);
  }
});

router.patch("/:id", validateToken, async (req, res, next) => {
  try {
    const cardId = req.params.id;
    const userId = req.user._id;

    const card = await Card.findOne({ _id: cardId, likes: userId });

    if (card) {
      // User has already liked the card, remove the like
      const unlikeCard = await Card.findByIdAndUpdate(
        cardId,
        { $pull: { likes: userId } },
        { new: true }
      );

      if (!unlikeCard) {
        throw new BizCardsError("Card not found", 404);
      }

      res.json({ card: unlikeCard, liked: false });
    } else {
      // User has not liked the card, add the like
      const likeCard = await Card.findByIdAndUpdate(
        cardId,
        { $push: { likes: userId } },
        { new: true }
      );

      if (!likeCard) {
        throw new BizCardsError("Card not found", 404);
      }

      res.json({ card: likeCard, liked: true });
    }
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", isAdminOrCardCreator, async (req, res, next) => {
  try {
    const cardId = req.params.id;

    // Find and delete the card with the specified ID
    const deletedCard = await Card.findOneAndDelete({ _id: cardId });

    if (!deletedCard) {
      return res.status(404).json({ error: "Card not found" });
    }

    Logger.verbose("Deleted the card");

    return res.json(deletedCard);
  } catch (error) {
    console.error("Error deleting card:", error);
    next(error);
  }
});

router.patch("/bizNumber/:id", isAdmin, async (req, res, next) => {
  try {
    const cardId = req.params.id;
    const newBizNumber = req.body.bizNumber;

    const isBizNumberUnique = await Card.findOne({ bizNumber: newBizNumber });

    if (isBizNumberUnique) {
      return res.status(400).json({
        error: "Business number already exists. Choose a different number.",
      });
    }

    const updatedCard = await Card.findByIdAndUpdate(
      cardId,
      { bizNumber: newBizNumber },
      { new: true }
    );

    res.json({ card: updatedCard });
  } catch (e) {
    next(e);
  }
});

export { router as cardsRouter };
