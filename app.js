const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
const StringFile = require(__dirname+"/hide.js");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(StringFile.dbString(), {
  useNewUrlParser: true,
}).then(()=>console.log("connection successful...!"))
.catch((err)=>console.log("Not Connected...!"))
;

const itemSchema = { name: String };

const Item = mongoose.model("Item", itemSchema);

const buyFood = new Item({ name: "Welcome!" });

const cookFood = new Item({ name: "Click + to Add new items." });

const eatFood = new Item({ name: "<-- click here to remove item(s)." });

const defaultItems = [buyFood, cookFood, eatFood];

const listSchema = { name: String, items: [itemSchema] };

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({})
    .then((foundItems) => {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => console.log("Inserted!"))
          .catch((err) => console.log("Error!"));
        req.redirect("/");
      } else
        res.render("list", { listTitle: "Today", newListItems: foundItems });
    })
    .catch(() => console.log("Error!"));
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then((foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemID = req.body.checkBox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemID)
      .then(() => console.log("Deleted!"))
      .catch((err) => console.log("Error!"));
    res.redirect("/");
  }else{
    List.findOneAndUpdate({name:listName}, {$pull: {items:{_id:checkedItemID}}})
    .then(()=>res.redirect("/"+listName));
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }).then((result) => {
    if (!result) {
      const list = new List({
        name: customListName,
        items: defaultItems,
      });
      list.save();
      res.redirect("/" + customListName);
    } else
      res.render("list", {
        listTitle: customListName,
        newListItems: result.items,
      });
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
