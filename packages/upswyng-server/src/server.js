import "./utility/slackbot.ts";

import * as dotenv from "dotenv";
import * as sapper from "@sapper/server";

import app from "./app.ts";
import getUserFromRawUsers from "./utility/getUserFromRawUsers.ts";
import mongoose from "mongoose";

dotenv.config();

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === "development";

// Database setup
const {
  DATABASE_URL,
  DATABASE_NAME,
  DATABASE_PASSWORD,
  DATABASE_USER,
} = process.env;

const { ALGOLIA_INDEX_NAME } = process.env;

if (dev && /heroku_.*/.test(DATABASE_NAME)) {
  throw new Error(
    "💩 You're attempting to use the production datebase in a dev enviroment."
  );
}

if (dev && /prod/.test(ALGOLIA_INDEX_NAME)) {
  console.warn(
    "😮 You're running in a dev environment but it appears you're using the production Algolia index." +
      "This can cause problems if it was not intentional."
  );
}

mongoose
  .connect(DATABASE_URL, {
    useNewUrlParser: true,
    dbName: DATABASE_NAME,
    user: DATABASE_USER,
    pass: DATABASE_PASSWORD,
  })
  .then(
    () => console.log(`Connected to MongoDB instance at ${DATABASE_URL}`),
    e =>
      console.error(
        `There was an error connecting to the MongoDB instance at ${DATABASE_URL}:\n${e}`
      )
  );

const grantConfig = {
  defaults: {
    protocol: process.env.SERVER_PROTOCOL || "http",
    host: process.env.SERVER_HOST || "localhost:3000",
    transport: "session",
    state: true,
  },
  google: {
    key: process.env.OAUTH_GOOGLE_CLIENT_ID,
    secret: process.env.OAUTH_GOOGLE_CLIENT_SECRET,
    scope: ["openid", "email"],
    nonce: true,
    // eslint-disable-next-line @typescript-eslint/camelcase
    custom_params: { access_type: "offline" },
    callback: "/callback",
  },
  facebook: {
    key: process.env.OAUTH_FACEBOOK_CLIENT_ID,
    secret: process.env.OAUTH_FACEBOOK_CLIENT_SECRET,
    scope: ["email"],
    nonce: true,
    callback: "/callback",
  },
};

if (!process.env.DATABASE_SESSION_SECRET) {
  console.warn(
    "Starting session storage with default secret. \
    Please set a secret at `DATABASE_SESSION_SECRET` ENV variable."
  );
}

app({
  dev,
  grantConfig,
  mongooseConnection: mongoose.connection,
  sessionSecret: process.env.DATABASE_SESSION_SECRET || "default_secret",
})
  .use(
    sapper.middleware({
      session: (req, _res) => {
        return { user: getUserFromRawUsers(req) };
      },
    })
  )
  .listen(PORT, err => {
    if (err) console.error("Error starting polka server:", err);
  });
