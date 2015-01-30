var JSONPatch;

(function(JSONPatch){

   // Utility
   var isArray=Array.isArray || function (obj){
      return obj.push && typeof obj.length === 'number';
   };

   // this may be a little thin
   var pathContainsSubpath=function(path, subpath){

      path.charAt(0)==="/" && (path=path.substr(1));
      subpath.charAt(0)==="/" && (subpath=subpath.substr(1));

      return (subpath.substr(0, path.length)===path);
   };

   var pathListContainsSubpath=function(pathList, subpath){

      for(var i=0, l=pathList.length; i<l; i++)
      {
         if(pathContainsSubpath(pathList[i], subpath))
         {
            return true;
         }
      }

      return false;
   };

   var objOps = {
        add: function (obj, key) {
            obj[key] = this.value;
            return true;
        },
        remove: function (obj, key) {
            delete obj[key];
            return true;
        },
        replace: function (obj, key) {
            obj[key] = this.value;
            return true;
        },
        move: function (obj, key, tree) {
            var temp = { op: "_get", path: this.from };
            apply([temp], tree);
            apply([{ op: "remove", path: this.from }], tree);
            apply([{ op: "add", path: this.path, value: temp.value }], tree);
            return true;
        },
        copy: function (obj, key, tree) {
            var temp = { op: "_get", path: this.from };
            apply([temp], tree);
            apply([{ op: "add", path: this.path, value: temp.value }], tree);
            return true;
        },
        test: function (obj, key) {
            return (JSON.stringify(obj[key]) === JSON.stringify(this.value));
        },
        _get: function (obj, key) {
            this.value = obj[key];
        }
    };

    var arrOps = {
        add: function (arr, i) {
            arr.splice(i, 0, this.value);
            return true;
        },
        remove: function (arr, i) {
            arr.splice(i, 1);
            return true;
        },
        replace: function (arr, i) {
            arr[i] = this.value;
            return true;
        },
        move: objOps.move,
        copy: objOps.copy,
        test: objOps.test,
        _get: objOps._get
    };

   function patch(patch, doc){

      if(isArray(doc))
      {

      }

   };

   function unpatch(patch, doc){

   };



   /**
    * Applies the given patch to the given value
    * @param {Object} patch An RFC6902 compliant JSON patch
    * @param {Mixed} value The value to be patched
    * @return {Object} An RFC6902 compliant JSON patch
    */
   function apply(patches, tree){

      var result = false, p = 0, plen = patches.length, patch;

      while (p < plen)
      {
         patch = patches[p];

         // Find the object
         var keys = patch.path.split('/');
         var obj = tree;
         var t = 1;
         var len = keys.length;

         while (true)
         {
            if (isArray(obj))
            {
               var index = parseInt(keys[t], 10);
               t++;

               if (t >= len)
               {
                  result = arrOps[patch.op].call(patch, obj, index, tree); // Apply patch
                  break;
               }

               obj = obj[index];
            }
            else
            {
               var key = keys[t];

               if (key.indexOf('~') != -1)
               {
                  key = key.replace(/~1/g, '/').replace(/~0/g, '~'); // escape chars
               }

               t++;

               if(t >= len)
               {
                  result = objOps[patch.op].call(patch, obj, key, tree); // Apply patch
                  break;
               }

               obj = obj[key];
            }
         }

         p++;
      }

      return result;
   }

   JSONPatch.apply = apply;

   /**
    * Will return the given patch after it's abridged according to the supplied directives
    *
    * @param {Object} patch A RFC6902 patch to be abridged
    * @param {Object} options The directives the function will honor when summarizing the patch
    * @return {Object} A RFC6902 compliant JSON patch
    */
   JSONPatch.abridge=function(patch, options){

      options && options.mergeUpdates && console.warn("*mergeUpdates* is currently not supported")
      options && options.mergeCreatesAndUpdates && console.warn("*mergeCreatesAndUpdates* is currently not supported")

      options || (options={ignoreDeletedObjects:true, coalesceUpdates:true, mergeUpdates:true, mergeCreatesAndUpdates:true});

      var ignoreDeletedObjects=!!options.ignoreDeletedObjects;
      var coalesceUpdates=!!options.coalesceUpdates;
      var mergeUpdates=!!options.mergeUpdates;  // this overrides shouldCoalesceUpdates... you can't merge without coalescing
      var mergeCreatesAndUpdates=!!options.mergeCreatesAndUpdates; // this overrides shouldMergeUpdates... you can't merge the creates with the updates without merging the updates

      var abridged=[];
      var updatedPaths=[];
      var removedPaths=[];

      for(var i=patch.length-1, operation, path, op; (operation=patch[i]); i--)
      {
         path=operation.path;
         op=operation.op;

         // console.log(operation);

         if(!ignoreDeletedObjects || !pathListContainsSubpath(removedPaths, path))
         {
            if(!coalesceUpdates || !pathListContainsSubpath(updatedPaths, path))
            {
               abridged.unshift(operation);
            }
         }

         // record
         ignoreDeletedObjects && op==="remove" && removedPaths.push(path);
         coalesceUpdates && (op==="replace" || op==="move" || op==="copy") && updatedPaths.push(path);
      }

      // console.log("abridged(with options:", options, ") " + patch.length + " operations into " + abridged.length + ": " + Math.round(100-(abridged.length/patch.length)*100) + "% compression", options);
      // console.log(abridged);

      return abridged;
   };

   JSONPatch.getReverseOperation=function(operation){

      var path=operation.path;
      var op=operation.op;
      var reverse=null;

      switch(op)
      {
         case "add" :
         {
            reverse={
               op: "remove",
               path: path
            };

            break;
         }

         case "remove" :
         {
            if(!("value" in operation))
            {
               console.warn("JSONPatch.reverse can't reverse remove without old value.", operation);
            }

            reverse={
               op: "add",
               path: path,
               value: op.value
            };

            break;
         }

         case "replace" :
         {
            if(!("oldValue" in operation))
            {
               console.warn("JSONPatch.reverse can't reverse replace without old value.", operation);
            }

            reverse={
               op: "replace",
               path: path,
               value: op.oldValue
            };

            break;
         }

         case "move" :
         case "copy" :
         {
            reverse={
               op: op,
               from: path,
               path: from
            };

            break;
         }
      }

      return reverse;

   };

   JSONPatch.reverse=function(patch){

      console.warn("JSONPatch.reverse is not tested")

      var reversed=[];

      for(var i=patch.length-1, operation, path, op; (operation=patch[i]); i--)
      {
         reversed.push(JSONPatch.inverseOperation(operation));
      }

      return reversed;
   };

   JSONPatch._getOpLogString=function(p){

      var string="";

      switch(p.op)
      {
         case "add" :
         {
            string="+ " + p.value + " @ " + p.path;
            break;
         }

         case "copy" :
         {
            string="≫ @ " + p.from + " to @ " + p.path;
            break;
         }

         case "move" :
         {
            string="> @ " + p.from + " to @ " + p.path;
            break;
         }

         case "remove" :
         {
            string="- " + p.path;
            break;
         }

         case "replace" :
         {
            string="~ " + p.path + " " + p.value;
            break;
         }
      }

      return string;
   };

   JSONPatch.getLogString=function(patch){

      var string="[\n";

      for(var i=0, l=patch.length; i<l; i++)
      {
         string+="   " + JSONPatch._getOpLogString(patch[i]) + "\n";
      }

      string+="]";

      return string;
   };


   //====================================================================================================
   //= OT Style Extensions
   //====================================================================================================

   /**
   * Returns a patch that includes *patch* after prepending *againstPatch*
   *
   * @param {Array}
   * @param {Array}
   * @param {Object} options An object containing directives for the rebasing operation
   */
   JSONPatch.transformPatchByPatch=function(localPatch, remotePatch, options){

      var transformedPatch=[];
      var transformedOperation;
      var localPatchOperationIndex=0;

      for(var i=0, l=remotePatch.length; i<l; i++)
      {
         transformedOperation=JSONPatch.getOperationTransformedByOperation(localPatch[localPatchOperationIndex]);

         JSONPatch.transformPatchByOperation(localPatch, remotePatch[i], options);
      }

      return transaformedPatch;
   };

   JSONPatch.transformPatchByOperation=function(patch, operation, options){

      var transformedOperation;

      for(var i=0, l=patch.length; i<l; i++)
      {
         transformedOperation=JSONPatch.getOperationTransformedByOperation(patch[i], operation, options);
      }
   };


   /**
   * Standard Operation
   *    /Todo/1234/title
   *
   * Custom Operation
   *    /Node/1234/x < 12.3
   */
   JSONPatch.getOperationTransformedByOperation=function(local, remote, options){

      var localPath=local.path;
      var remotePath=remote.path;
      var localPathComponents=localPath.substr(1).split("/");
      var remotePathComponents=remotePath.substr(1).split("/");

      var localOp=local.op;
      var remoteOp=remote.op;

      var sameIdentity=(localPathComponents.slice(0, 2).join("/")===remotePathComponents.slice(0, 2).join("/")); // /Task/1234/title becomes /Task/1234
      var sameKey=(localPathComponents[2]===remotePathComponents[2]);

      var transformedOperation;

      if(sameIdentity)
      {
         if((localOp==="delete" && remoteOp==="replace") || (remoteOp==="delete" && localOp==="replace")) // delete + update = delete, update + delete = delete - a delete action wins over an update action
         {
            console.log("delete overrides replace");

            transformedOperation=null;
            //p=Promise.resolve(localOp==="delete" ? "local" : "remote");
         }
         else if(localOp==="delete" && remoteOp==="delete") // delete + delete = delete, delete + delete = delete - a remote delete wins over a local delete
         {
            console.log("matching deletes are redundant");

            transformedOperation=null;
         }
         else if(localOp==="replace" && remoteOp==="replace") // an update on the same key yields a conflict, otherwise the changes commute
         {
            if(sameKey)
            {
               console.log("key collsion, going out for resolution");
               // p=this._resolveConflict(localAction, remoteAction);
            }
            else
            {
               console.log("no key collision, commute");
               transformedOperation=local;
            }
         }
         else
         {
            console.log("no conflict between actions");
            transformedOperation=null;
            // p=this._resolveConflict(localAction, remoteAction);
         }
      }

      // if(appliedOperation.path===originalOperation.path)
      // {
      //    if(appliedOperation.op==="delete")
      //    {
      //       transformedOperation=null;
      //    }
      //
      // }

      return transformedOperation;
   };

})(JSONPatch || (JSONPatch = {}));



(typeof(module)!=="undefined" ? (module.exports=JSONPatch) : (window.JSONPatch=JSONPatch));


var deleteOperation={
   op: "delete",
   path: "/Node/1234"
};

var updateOperation={
   op: "replace",
   path: "/Node/1234/title",
   value: "test"
};

console.log("ab: ", JSONPatch.getOperationTransformedByOperation(deleteOperation, updateOperation));
console.log("ba: ", JSONPatch.getOperationTransformedByOperation(updateOperation, deleteOperation));
