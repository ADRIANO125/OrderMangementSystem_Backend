const mongoose = require("mongoose");

const dbConnection = () => {
  mongoose
    .connect(process.env.MONGO_URI, {
      dbName: "order_manageMent_system",
    })
    .then(() => {
      console.log("DataBase Connected Successfully");
    })
    .catch((error) => {
      console.log("DataBase Connection Failed ", error);
    });
};

module.exports = dbConnection;
