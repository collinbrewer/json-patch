(function(){

   var JSONPatch={};

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

   function ensure(doc, keys)
   {
      var key;
      var nextKey;
      var isNumericKey;

      for(var i=0, l=keys.length-1; i<l; i++)
      {
         key=keys[i];

         if(key!=="")
         {
            isNumericKey=!isNaN(key);

            if(isNumericKey)
            {
               key=parseInt(key, 10);
            }

            if(!doc[key])
            {
               nextKey=keys[i+1];

               doc[key]=(isNaN(nextKey) ? {} : []);
            }
         }
      }
   }

   /**
    * Applies the given patch to the given value
    * @param {Object} patch An RFC6902 compliant JSON patch
    * @param {Mixed} value The value to be patched
    * @return {Object} An RFC6902 compliant JSON patch
    */
   function apply(patches, tree, options){

      var result = false, p = 0, plen = patches.length, patch;

      var force=options && options.force;

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
            if(force)
            {
               ensure(tree, keys);

               // console.log("doc is undefined, options: ", options);
               //
               // if(options.force)
               // {
               //    obj=isNaN(keys[t]) ? {} : [];
               // }
               //
               // console.log("obj: ", obj);
            }

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


   JSONPatch.isEmptyPatch=function(patch){

      var isEmptyPatch=(!patch || (patch.constructor===Array && patch.length===0) || JSON.stringify(patch)==="{}");

      return isEmptyPatch;
   };

   /**
    * isValidMergePatch
    * Returns true if the given patch is a valid merge patch.
    * A merge patch should be an object or an array whose values
    * are not objects that contain the "op" key, which would designate
    * a regular patch.
    */
   JSONPatch.isValidMergePatch=function(patch){

      var isMergePatch=false;

      if(patch && typeof(patch)==="object")
      {
         if(patch.constructor===Array)
         {
            if(patch.length>0)
            {
               isMergePatch=!("operation" in patch[0]);
            }
            else
            {
               isMergePatch=true; // it's valid...
            }
         }
         else
         {
            isMergePatch=true;
         }
      }

      return isMergePatch;
   };

   var _mergeMappingsByKey=function(wildcardMapping, primaryMapping){

      var mapping={};

      if(wildcardMapping)
      {
         for(var key in wildcardMapping)
         {
            mapping[key]=wildcardMapping[key];
         }
      }

      if(primaryMapping)
      {
         for(var key in primaryMapping)
         {
            mapping[key]=primaryMapping[key];
         }
      }

      return mapping;
   };

   /**
    * translateToMapping
    * Returns a new patch translated to the form of the given mapping
    * @param {Mixed} patch The patch to be translated
    * @param {Object} mapping The mapping to be used during translation
    * @return {Mixed} The translated patch
    */
   JSONPatch.translateToMapping=function(patch, mapping){

      var translated;

      if(!JSONPatch.isEmptyPatch(patch))
      {
         if(JSONPatch.isValidMergePatch(patch))
         {
            translated={};

            var wildcardEntityMapping=mapping["*"];

            // NOTE: this isn't comprehensive for all the capabilities of the merge patch spec, but it works for our purposes

            for(var sourceEntityName in patch)
            {
               var sourceEntityPatch=patch[sourceEntityName];
               var destinationEntityName=sourceEntityName;
               var entityMapping=_mergeMappingsByKey(wildcardEntityMapping, mapping[sourceEntityName]);

               translated[sourceEntityName]=[];

               for(var i=0, l=sourceEntityPatch.length; i<l; i++)
               {
                  var sourceNode=sourceEntityPatch[i];

                  translated[sourceEntityName][i]=JSONMapping.toEntityMapping(entityMapping, sourceNode);

                  // var destinationNode=(translated[sourceEntityName][i]={});
                  //
                  // for(var sourcePropertyKey in sourceNode)
                  // {
                  //    var destinationPropertyKey=store.mapStoreKeyToEntityKey(sourceEntityName, sourcePropertyKey);
                  //    var destinationPropertyKey
                  //
                  //    console.log("source property key for " + sourceEntityName + "." + sourcePropertyKey + ": ", destinationPropertyKey);
                  //
                  //    // translated[ObjectType][num]=sourceNode[sourcePropertyKey];
                  //    destinationNode[destinationPropertyKey]=sourceNode[sourcePropertyKey];
                  // }
               }
            }
         }
         else
         {
            console.log("is patch");

            var sID=store.identifier,
                p,
                t,
                keys,
                key, value;

            translated=[];

            for(var i=0, l=patch.length, op; i<l, (op=patch[i]); i++)
            {
               //console.log(p);

               t={"operation":op.operation,
                  "entityName":op.object.getID().entity.name}; // FIXME: need to use the key and entity mapping to explain the operations to the store

               if(op.operation!==0) // creates don't get object ids...
               {
                  t.nodeID=op.object.getID().reference;
               }

               if("keys" in op)
               {
                  keys=op.keys;
                  values=op.values;
               }
               else if("key" in op)
               {
                  keys=[op.key];
                  values=[op.value];
               }

               if(keys)
               {
                  // kvps
                  t.keys=[];
                  t.values=[];
                  //t.data={};

                  for(var j=0, n=keys.length; j<n; j++)
                  {
                     key=keys[j];
                     value=values[j];

                     // console.log("working on: ", key);

                     p=HRManagedObjectModel.getPropertyWithName(op.object.entity, key);

                     t.keys.push(key);
                     t.values.push(this._flattenValueForProperty(value, p));
                     //t.data[key]=value;
                  }
               }

               translated.push(t);
            }
         }
      }
      else
      {
         translated=patch; // just return what we received
      }

      return translated;
   };

   /**
    * translateFromMapping
    * Returns a new patch translated from the form of the given mapping
    * @param {Mixed} patch The patch to be translated
    * @param {Object} mapping The mapping to be used during translation
    * @return {Mixed} The translated patch
    */
   JSONPatch.translateFromMapping=function(patch, mapping){

      var inverseMapping=JSONMapping.inverseSchemaMapping(mapping);
      var translated=JSONPatch.translateToMapping(patch, inverseMapping);

      return translated;
   };

   // export
   (typeof(module)!=="undefined" ? (module.exports=JSONPatch) : ((typeof(define)!=="undefined" && define.amd) ? define(function(){ return JSONPatch; }) : (window.JSONPatch=JSONPatch)));
})();
