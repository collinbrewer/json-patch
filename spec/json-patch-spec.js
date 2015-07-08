var should=require("chai").should();

var JSONPatch=require("../index.js");

describe("#patch", function(){

   describe("objects", function(){

      var o={a:{b:{}}};
      var v;

      // add
      v=["foo", "bar"];
      JSONPatch.apply([{"op":"add", "path":"/a/b/c", "value":v}], o);
      o.a.b.c.should.equal(v);

      // remove
      JSONPatch.apply([{ "op": "remove", "path": "/a/b/c" }], o);
      should.not.exist(o.a.b.c);

      // replace
      v=42;
      JSONPatch.apply([{ "op": "replace", "path": "/a/b/c", "value":v}], o);
      o.a.b.c.should.equal(v);

      // move
      JSONPatch.apply([{ "op": "move", "from": "/a/b/c", "path": "/a/b/d" }], o);
      should.not.exist(o.a.b.c);
      o.a.b.d.should.equal(v);

      // copy
      o.a.b.c="bar";
      JSONPatch.apply([{ "op": "copy", "from": "/a/b/c", "path": "/a/b/e" }], o);
      o.a.b.c.should.equal(o.a.b.e);

      // test
      o.a.b.c="foo";
      JSONPatch.apply([{ "op": "test", "path": "/a/b/c", "value": "foo" }], o).should.equal(true);
      JSONPatch.apply([{ "op": "test", "path": "/a/b/c", "value": "bar" }], o).should.equal(false);
   });

   describe("arrays", function(){

      var o={};

      // add
      o={ "foo": [ "bar", "baz" ] };
      JSONPatch.apply([{ "op": "add", "path": "/foo/1", "value": "qux" }], o);

      o.foo[1].should.equal("qux");

      // remove
      o={ "foo": [ "bar", "qux", "baz" ] };
      JSONPatch.apply([{ "op": "remove", "path": "/foo/1" }], o);
      o.foo[1].should.equal("baz");

      // replace
      o={ "foo": [ "bar", "qux", "baz" ] };
      JSONPatch.apply([{ "op": "replace", "path": "/foo/1", "value":"goo" }], o);
      o.foo[1].should.equal("goo");

      // move
      o={ "foo": [ "all", "grass", "cows", "eat" ] };
      JSONPatch.apply([{ "op": "move", "from": "/foo/1", "path": "/foo/3" }], o);
      o.foo[3].should.equal("grass");

      // copy
      o={ "foo": [ "bar", "qux", "baz" ] };
      JSONPatch.apply([{ "op": "copy", "from": "/foo/1", "path": "/foo/1" }], o);

      o.foo[2].should.equal("qux");

      // test
      o={"baz": "qux", "foo": [ "a", 2, "c" ]};
      JSONPatch.apply([{ "op": "test", "path": "/baz", "value": "qux" }, { "op": "test", "path": "/foo/1", "value": 2 }], o).should.equal(true);
   });

   describe("forced patching", function(){

      it("should patch array", function(){

         var o={};

         JSONPatch.apply([{"op":"add", "path":"/foo/0", "value":"qux"}], o, {"force":true});

         o.should.have.property("foo");
         o.foo.should.be.a("array");
         o.foo[0].should.equal("qux");
      });
   });

   describe("forced patching objects", function(){

      it("should patch object", function(){

         var o={};

         JSONPatch.apply([{"op":"add", "path":"/a/b", "value":"c"}], o, {"force":true});

         o.should.have.property("a");
         o.a.should.have.property("b");
         o.a.b.should.equal("c");
      });
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
      // {"op":"copy", "from":"/foo/bar/qux", "path":"foo/bar/mux"}, // {foo:{bar:{qux:"asdf", mux:"asdf"}}}
      // {"op":"add", "path":"/foo/baz", "value":{}},                // {foo:{bar:{qux:"asdf", mux:"asdf"}, baz:{}}}
      // {"op":"replace", "path":"/foo/baz", "value":"goo"},         // {foo:{bar:{qux:"asdf", mux:"asdf"}, baz:"goo"}}
      // {"op":"replace", "path":"/foo/baz", "value":"roo"},         // {foo:{bar:{qux:"asdf", mux:"asdf"}, baz:"roo"}}
      // {"op":"move", "from":"/foo/baz", "path":"/foo/roo"},        // {foo:{bar:{qux:"asdf", mux:"asdf"}, roo:"roo"}}
      {"op":"remove", "path":"/foo/bar", "value":{}},             // {foo:{roo:"roo"}}
   ];

   it("should return a remove operation", function(){
      var reverse=JSONPatch.getReverseOperation({"op":"add", "path":"/foo/bar", "value":{}})
      reverse.op.should.equal("remove");
   });

   it("should return an add operation", function(){
      var reverse=JSONPatch.getReverseOperation({"op":"remove", "path":"/foo/bar"});
      reverse.op.should.equal("add");
   });

   it("should return a replace operation", function(){
      var reverse=JSONPatch.getReverseOperation({"op":"replace", "path":"/foo/bar", "value":"qux"});
      reverse.op.should.equal("replace");
   });

   it("should return a reverse patch"/*, function(){
      var reverse=JSONPatch.reverse(patch);

      reverse.should.be.an("array");
      reverse[0].should.have.property("op");
      reverse[0].op.should.equal("add");
   }*/);
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

describe("Mapping", function(){

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

   mapped.Todo[0].should.have.property("ID");
   mapped.Todo[0].should.not.have.property("id");
   mapped.Todo[0].ID.should.equal(1);

   var unmapped=JSONPatch.translateFromMapping(mapped, mapping);

   unmapped.Todo[0].should.not.have.property("ID");
   unmapped.Todo[0].should.have.property("id");
   unmapped.Todo[0].id.should.equal(1);
});


// see /Users/collinbrewer/Documents/Brewer-Collective/Projects/Products/Coinage/versionify/versionify.js
describe("Conversion", function(){

   it("should convert a merge patch to a patch");
   it("should convert a patch to a merge patch");
});
