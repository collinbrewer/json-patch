var MochiComparators={
   "==" : "equal to",
   "===" : "exactly equal to",
   "!=" : "not equal to",
   "!==" : "exactly not equal to",
   ">" : "greater than",
   ">=" : "greater than or equal",
   "<" : "less than",
   "<=" : "less than or equal ",
   "in" : "in"
};

function mochi(title, a, comparator, b)
{
   /* jshint evil:true */
   if(arguments.length===1)
   {
      it(title);
   }
   else
   {
      if(typeof(a)==="function")
      {
         it(title + ": function return should " + MochiComparators[comparator] + " " + b, function(){ a=a(); eval("if(!(a " + comparator + " b)) throw new Error(a + ' is not ' + MochiComparators[comparator] + ' ' + b);"); });
      }
      else
      {
         it(title + ": " + a + " should be " + MochiComparators[comparator] + " " + b, function(){ eval("if(!(a " + comparator + " b)) throw new Error(a + ' is not ' + MochiComparators[comparator] + ' ' + b);"); });
      }
   }
}

mochi.assert=function(title, a, comparator, b){

   a=typeof(a)==="string" ? ("'" + a + "'") : a;
   b=typeof(b)==="string" ? ("'" + b + "'") : b;

   if(!eval(a + comparator + b))
   {
      throw new Error(a + ' is not ' + MochiComparators[comparator] + ' ' + b);
   }
};

var JSONMapping=require("../index.js");

describe("#inverseEntityMapping", function(){

   var mapping={
      "oldkey": "newkey",
      "keytoremove" : null
   };

   var inversed=JSONMapping.inverseEntityMapping(mapping);

   console.log("inversed: ", inversed);

   mochi("new key", "newkey", "in", inversed);
   mochi("value at 'newkey'", inversed.newkey, "===", "oldkey");
   mochi("ignored key exists", ("null" in inversed), "===", false);
});

describe("#inverseSchemaMapping", function(){

   var mapping={
      "entity":{
         "oldkey": "newkey",
         "keytoremove": null
      }
   };

   var inversed=JSONMapping.inverseSchemaMapping(mapping);

   mochi("new key", "newkey", "in", inversed.entity);
   mochi("value at 'entity.newkey'", inversed.entity.newkey, "===", "oldkey");
   mochi("ignored key exists", ("null" in inversed.entity), "===", false);
});

describe("#toEntityMapping", function(){

   var unmapped={
      "oldkey": "value",
      "unmapped": "value2",
      "keytoremove": "value3"
   };

   var mapping={
      "oldkey": "newkey",
      "keytoremove": null
   };

   var mapped=JSONMapping.toEntityMapping(mapping, unmapped);

   console.log("mapped: ", mapped);

   mochi("mapped key exists", "newkey", "in", mapped);
   mochi("value at 'newkey'", mapped.newkey, "===", "value");
   mochi("unmapped key exists", "unmapped", "in", mapped);
   mochi("ignored key exists", ("keytoremove" in mapped), "===", false);
   mochi("null key exists", ("null" in mapped), "===", false);
});

// describe("#toSchemaMapping", function(){
//
//    var unmapped={
//       "entity":{
//          "oldkey": "value"
//       }
//    };
//
//    var mapping={
//       "entity":[{
//          "oldkey": "newkey"
//       }]
//    };
//
//    var mapped=JSONMapping.toSchemaMapping(mapping, unmapped);
//
//    console.log(JSON.stringify(mapped));
//
//    mochi("original key doesn't exist", ("oldkey" in mapped.entity), "===", false);
//    mochi("new key exists", ("newkey" in mapped.entity), "===", true);
//    mochi("value exists at new key", mapped.newkey, "===", "value");
// });

describe("#fromEntityMapping", function(){

   var mapped={
      "newkey": "value",
      "unmapped": "value2",
      "keytoremove": null
   };

   var mapping={
      "oldkey": "newkey"
   };

   var unmapped=JSONMapping.fromEntityMapping(mapping, mapped);

   mochi("original key", "oldkey", "in", unmapped);
   mochi("value at 'oldkey'", unmapped.oldkey, "===", "value");
   mochi("unmapped key", "unmapped", "in", unmapped);
});
