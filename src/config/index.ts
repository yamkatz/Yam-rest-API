import { config } from "dotenv";

const configDotEnv = () => {
  //load the main/general .env file
  config({ path: "src/config/.env" });

  const mode = process.env.NODE_ENV; //dev or| test or| prod
  console.log("App is running in", mode, "Mode");
  console.log("Config file:", `crs/config/${mode}.env`);

  config({ path: `src/config/${mode}.env` });
};

export default configDotEnv;
export { configDotEnv };
