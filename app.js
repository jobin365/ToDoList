//jshint esversion:6

const express = require("express");
const app = express();
const mongoose = require('mongoose');
const _ = require('lodash');

app.use(express.json())
app.use(express.urlencoded({
  extended: true
}))
app.set("view engine", "ejs");
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todolistDB')

const itemSchema = {
  name: String
}
const Item = mongoose.model('Item', itemSchema);
const defaultItems = [{
    name: 'Do homework'
  },
  {
    name: 'Go to shop'
  },
  {
    name: 'Attend class'
  }
]

const listSchema = {
  name: String,
  items: [itemSchema]
}

const List = mongoose.model('List', listSchema);

app.get("/", function (req, res) {
  Item.find(function (err, items) {
    if (err)
      console.log(err)
    else {
      if (items.length == 0) {
        Item.insertMany(defaultItems, function (err) {
          if (err) console.log(err)
          else console.log('Success')
        })
        res.redirect('/')
      } else {
        res.render("list", {
          todayIs: "Today",
          foundItems: items
        });
      }
    }
  })
})

app.get("/about", function (req, res) {
  res.render("about")
})

app.get("/:listName", function (req, res) {
  const customListName = _.capitalize(req.params.listName);
  List.findOne({
    name: customListName
  }, function (err, results) {
    if (!err) {
      if (!results) {
        const newList = new List({
          name: customListName,
          items: defaultItems
        })

        newList.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          todayIs: results.name,
          foundItems: results.items
        })
      }
    } else {
      console.log(err);
    }
  })
})

app.post("/", function (req, res) {
  const item = req.body.task;
  const list = req.body.push;
  if (list === "Today") {
    const newItem = new Item({
      name: item
    })
    console.log(newItem);
    newItem.save();
    res.redirect("/")
  } else {
    List.findOne({
      name: list
    }, function (err, doc) {
      if (!err) {
        doc.items.push({
          name: item
        });
        doc.save();
        res.redirect("/" + list);
      } else
        console.log(err);
    })
  }

})

app.post("/delete", function (req, res) {
  const toBeDeleted = req.body.deleted;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(toBeDeleted, function (err) {
      if (err) console.log(err)
      else console.log('Success')
    })
    res.redirect("/")
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: toBeDeleted
        }
      }
    }, function (err, docs) {
      if (err)
        console.log(err);
    });
    res.redirect("/" + listName);
  }
})

app.listen(3000, function () {
  console.log("Server started on port 3000.");
});