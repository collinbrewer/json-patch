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


define(["./bower_components/json-mapping/json-mapping", "../jsonpatch"], function(JSONMapping, JSONPatch){

   console.log("jsonmapping: ", JSONMapping);
   console.log("jsonpatch: ", JSONPatch);

   describe("#patch", function(){

      describe("objects", function(){

         var o={a:{b:{}}};
         var v;

         // add
         v=["foo", "bar"];
         JSONPatch.apply([{"op":"add", "path":"/a/b/c", "value":v}], o);

         mochi("add", o.a.b.c, "===", v);

         // remove
         JSONPatch.apply([{ "op": "remove", "path": "/a/b/c" }], o);

         mochi("remove", o.a.b.c, "===", undefined);

         // replace
         v=42;
         JSONPatch.apply([{ "op": "replace", "path": "/a/b/c", "value":v}], o);
         mochi("replace", o.a.b.c, "===", v);

         // move
         JSONPatch.apply([{ "op": "move", "from": "/a/b/c", "path": "/a/b/d" }], o);
         mochi("move from", o.a.b.c, "===", undefined);
         mochi("move to", o.a.b.d, "===", v);

         // copy
         o.a.b.c="bar";
         JSONPatch.apply([{ "op": "copy", "from": "/a/b/c", "path": "/a/b/e" }], o);
         mochi("copy", o.a.b.c, "===", o.a.b.e);

         // test
         o.a.b.c="foo";
         mochi("test", JSONPatch.apply([{ "op": "test", "path": "/a/b/c", "value": "foo" }], o), "===", true);
         mochi("test", JSONPatch.apply([{ "op": "test", "path": "/a/b/c", "value": "bar" }], o), "===", false);
      });

      describe("arrays", function(){

         var o={};

         // add
         o={ "foo": [ "bar", "baz" ] };
         JSONPatch.apply([{ "op": "add", "path": "/foo/1", "value": "qux" }], o);

         mochi("add", o.foo[1], "===", "qux");

         // remove
         o={ "foo": [ "bar", "qux", "baz" ] };
         JSONPatch.apply([{ "op": "remove", "path": "/foo/1" }], o);
         mochi("remove", o.foo[1], "===", "baz");

         // replace
         o={ "foo": [ "bar", "qux", "baz" ] };
         JSONPatch.apply([{ "op": "replace", "path": "/foo/1", "value":"goo" }], o);
         mochi("replace", o.foo[1], "===", "goo");

         // move
         o={ "foo": [ "all", "grass", "cows", "eat" ] };
         JSONPatch.apply([{ "op": "move", "from": "/foo/1", "path": "/foo/3" }], o);
         mochi("remove", o.foo[3], "===", "grass");

         // copy
         o={ "foo": [ "bar", "qux", "baz" ] };
         JSONPatch.apply([{ "op": "copy", "from": "/foo/1", "path": "/foo/1" }], o);

         mochi("copy", o.foo[2], "===", "qux");

         // test
         o={"baz": "qux", "foo": [ "a", 2, "c" ]};
         mochi("test", JSONPatch.apply([{ "op": "test", "path": "/baz", "value": "qux" }, { "op": "test", "path": "/foo/1", "value": 2 }], o), "===", true);
      });

   });

   describe("#abridge", function(){

      var patch=[
         {"op":"add", "path":"/foo/bar", "value":{}},                // {foo:{bar:{}}}
         {"op":"replace", "path":"/foo/bar/qux", "value":"asdf"},    // {foo:{bar:{qux:"asdf"}}}
         {"op":"copy", "from":"/foo/bar/qux", "path":"foo/bar/mux"}, // {foo:{bar:{qux:"asdf", mux:"asdf"}}}
         // {"op":"add", "path":"/foo/baz", "value":{}},                // {foo:{bar:{qux:"asdf", mux:"asdf"}, baz:{}}}
         // {"op":"replace", "path":"/foo/baz", "value":"goo"},         // {foo:{bar:{qux:"asdf", mux:"asdf"}, baz:"goo"}}
         // {"op":"replace", "path":"/foo/baz", "value":"roo"},         // {foo:{bar:{qux:"asdf", mux:"asdf"}, baz:"roo"}}
         // {"op":"move", "from":"/foo/baz", "path":"/foo/roo"},        // {foo:{bar:{qux:"asdf", mux:"asdf"}, roo:"roo"}}
         // {"op":"remove", "path":"/foo/bar", "value":{}},             // {foo:{roo:"roo"}}
      ];

      var o;

      var testPatch=[
         {"op":"test", "path":"/foo/roo", "value":"roo"},
      ];

      var abridged;

      // no condense
      o={"foo":{}};
      // JSONPatch.apply(patch, o);


      // abridged=JSONPatch.abridge(patch, {ignoreDeletedObjects:false, coalesceUpdates:false});
      // console.log("abridged: ", abridged);
      // JSONPatch.apply(abridged, o);
      // mochi("no condense", abridged.length, "===", 8);
      // mochi("test", JSONPatch.apply(testPatch, o), "===", true);

      // console.log(o);

      // coalesce updates
      // abridged=JSONPatch.abridge(patch, {ignoreDeletedObjects:false, coalesceUpdates:true});
      // mochi("condense coalescing updates", abridged.length, "===", 7);
      //
      // // ignore removed
      // abridged=JSONPatch.abridge(patch, {ignoreDeletedObjects:true, coalesceUpdates:false});
      // mochi("condense ignoring removed", abridged.length, "===", 5);
      //
      // // condense all
      // abridged=JSONPatch.abridge(patch);
      // mochi("condense all", abridged.length, "===", 4);

   });


   describe("Reversing", function(){

      var patch=[
         {"op":"add", "path":"/foo/bar", "value":{}},                // {foo:{bar:{}}}
         {"op":"replace", "path":"/foo/bar/qux", "value":"asdf"},    // {foo:{bar:{qux:"asdf"}}}
         {"op":"copy", "from":"/foo/bar/qux", "path":"foo/bar/mux"}, // {foo:{bar:{qux:"asdf", mux:"asdf"}}}
         // {"op":"add", "path":"/foo/baz", "value":{}},                // {foo:{bar:{qux:"asdf", mux:"asdf"}, baz:{}}}
         // {"op":"replace", "path":"/foo/baz", "value":"goo"},         // {foo:{bar:{qux:"asdf", mux:"asdf"}, baz:"goo"}}
         // {"op":"replace", "path":"/foo/baz", "value":"roo"},         // {foo:{bar:{qux:"asdf", mux:"asdf"}, baz:"roo"}}
         // {"op":"move", "from":"/foo/baz", "path":"/foo/roo"},        // {foo:{bar:{qux:"asdf", mux:"asdf"}, roo:"roo"}}
         // {"op":"remove", "path":"/foo/bar", "value":{}},             // {foo:{roo:"roo"}}
      ];

      it("should return a remove operation", function(){
         mochi.assert("operation", JSONPatch.getReverseOperation({"op":"add", "path":"/foo/bar", "value":{}}).op, "===", "remove");
      });

      it("should return an add operation", function(){
         mochi.assert("operation", JSONPatch.getReverseOperation({"op":"remove", "path":"/foo/bar"}).op, "===", "add");
      });

      it("should return a replace operation", function(){
         mochi.assert("operation", JSONPatch.getReverseOperation({"op":"replace", "path":"/foo/bar", "value":"qux"}).op, "===", "replace");
      });
   });


   describe("Rebasing", function(){

      // it("should return an empty patch", function(){
      //    mochi.assert("string", JSONPatch.transformPatchByPatch(
      //       [{"op":"replace", "path":"/Todo/1234/title", "value":"test"}],
      //       [{"op":"delete", "path":"/Todo/1234/title", "value":"test"}]), "===", true);
      //
      // });

      // it("should return true if the value is a number", function(){
      //    var validator=Synth.synthesizeTypeValidator("number");
      //    mochi.assert("number", validator(1), "===", true);
      //    mochi.assert("number", validator("1"), "===", false);
      // });
      //
      // it("should return true if the value is a boolean", function(){
      //    var validator=Synth.synthesizeTypeValidator("boolean");
      //    mochi.assert("boolean", validator(false), "===", true);
      //    mochi.assert("non boolean", validator(1), "===", false);
      // });
      //
      // it("should return true if the value is a date", function(){
      //    var validator=Synth.synthesizeTypeValidator("date");
      //    mochi.assert("date", validator(new Date()), "===", true);
      //    mochi.assert("non date", validator(1), "===", false);
      // });

   });

   describe("Translating", function(){

      var patch=[
         {"op":"add", "path":"/Todo", "value":{}},                // {foo:{bar:{}}}
         {"op":"replace", "path":"/Todo/title", "value":"test"},    // {foo:{bar:{qux:"asdf"}}}
         {"op":"delete", "path":"/Todo"}, // {foo:{bar:{qux:"asdf", mux:"asdf"}}}
      ];

      var mergePatch={
         Todo:[
            {
               "id": 1,
               "title": "test"
            }
         ]
      };

      var propertyMapping1={"sourceName":"id", "destinationName":"ID"};
      var propertyMapping2={"sourceName":"title", "destinationName":"Title"};
      var entityMapping={"sourceName":"Todo", "destinationName":"Todo", propertyMappings:[propertyMapping1, propertyMapping2]};
      var schemaMapping={entityMappings:[entityMapping]}; // later indexed by the name of the entity mapping, which is autocreated as sourceName2destinationName

      var mapping={
         "*": {
            "id": "ID",
         },
         "Todo":{
            "title": "Title"
         }
      };

      var mapped=JSONPatch.translateToMapping(mergePatch, mapping);

      mochi("ID key", ("ID" in mapped.Todo[0]), "===", true);

      mochi("id dne", ("id" in mapped.Todo[0]), "===", false);

      mochi("ID value", mapped.Todo[0].ID, "===", 1);

      var unmapped=JSONPatch.translateFromMapping(mapped, mapping);

      mochi("ID key", ("ID" in unmapped.Todo[0]), "!==", true);

      mochi("id dne", ("id" in unmapped.Todo[0]), "!==", false);

      mochi("ID value", unmapped.Todo[0].ID, "!==", 1);
   });

   // global || window.mochaPhantomJS ? mochaPhantomJS.run() : mocha.run();

   mocha.run();
});
