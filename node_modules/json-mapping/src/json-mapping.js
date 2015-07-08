(function(){

   /**
    * JSONMapping
    * A JSON object that defines the mapping of properties to another format
    */
   var JSONMapping={};

   /**
    * inverseEntityMapping
    * Creates a new mapping that reverses the given mapping
    * Note: Will deprecate when dynamic mapper is complete
    * @param {Object} mapping The mapping to be inversed
    * @return {Object} The inversed mapping
    */
   JSONMapping.inverseEntityMapping=function(entityMapping){

      var inversed={};
      var propertyKey;

      for(var key in entityMapping)
      {
         propertyKey=entityMapping[key];

         if(propertyKey!==undefined && propertyKey!==null && propertyKey!=="")
         {
            inversed[propertyKey]=key;
         }
      }

      return inversed;
   };

   /**
    * inverseSchemaMapping
    * Creates a new schema mapping that reverses the given schema mapping
    * Note: Will deprecate when dynamic mapper is complete
    * @param {Object} mapping The mapping to be inversed
    * @return {Object} The inversed mapping
    */
   JSONMapping.inverseSchemaMapping=function(mapping){

      var inversed={};
      var entityMapping;

      for(var entityName in mapping)
      {
         entityMapping=mapping[entityName];

         inversed[entityName]=JSONMapping.inverseEntityMapping(entityMapping);
      }

      return inversed;
   };

   /**
   * toEntityMapping
   * Creates a new object after applying the given mapping to the given object
   * Note: Will deprecate when dynamic mapper is complete
   * @param {Object} mapping The mapping to be applied
   * @param {Object} object The object to be remapped
   * @return {Object} The object in the destination form of the given mapping
   */
   JSONMapping.toEntityMapping=function(entityMapping, object){

      var mappedObject={};
      var mappedKey;

      for(var key in object)
      {
         if(key in entityMapping)
         {
            mappedKey=entityMapping[key];

            if(mappedKey!==undefined && mappedKey!==null && mappedKey!=="")
            {
               mappedObject[mappedKey]=object[key];
            }
         }
         else
         {
            mappedObject[key]=object[key];
         }
      }

      return mappedObject;
   };

   /**
   * toSchemaMapping
   * Creates a new object after applying the given mapping to the given object
   * Note: Will deprecate when dynamic mapper is complete
   * @param {Object} mapping The mapping to be applied
   * @param {Object} object The object to be remapped
   * @return {Object} The object in the destination form of the given mapping
   */
   // JSONMapping.toSchemaMapping=function(mapping, object){
   //
   //    var mapped={};
   //    var entityMapping;
   //    var mappedObject={};
   //
   //    for(var entityName in mapping)
   //    {
   //       entityMapping=mapping[entityName];
   //       mappedObject=(mapped[entityName]={});
   //
   //       for(var key in object)
   //       {
   //          mappedObject[entityMapping[key]]=object[key];
   //       }
   //    }
   //
   //    return mapped;
   // };

   /**
   * fromEntityMapping
   * Creates a new object after unapplying the given mapping to the given object
   * Note: Will deprecate when dynamic mapper is complete
   * @param {Object} mapping The mapping to be unapplied
   * @param {Object} object The object to be remapped
   * @return {Object} The object in the source form of the given mapping
   */
   JSONMapping.fromEntityMapping=function(entityMapping, object){

      var inversed=JSONMapping.inverseEntityMapping(entityMapping);

      return JSONMapping.toEntityMapping(inversed, object);
   };


   /**
   * fromSchemaMapping
   * Creates a new object after unapplying the given mapping to the given object
   * Note: Will deprecate when dynamic mapper is complete
   * @param {Object} mapping The mapping to be unapplied
   * @param {Object} object The object to be remapped
   * @return {Object} The object in the source form of the given mapping
   */
   // JSONMapping.fromSchemaMapping=function(mapping, object){
   //
   //    var inversed=JSONMapping.inverseSchemaMapping(mapping);
   //
   //    return JSONMapping.toSchemaMapping(inversed, object);
   // };


   /**
    * _index
    * Internal method for indexing a JSON Mapping into a static lookup table
    * @param {Object} The original mapping
    */
   function _index(mapping){

      var index={};

      console.warn("Not Yet Implemented");

      return index;
   };

   /**
    * _dynamicMapper (internal)
    * The new engine behind the mapper that handles mappings dynamically based
    * on inferred schema.
    */

   var _dynamicMapper=function(mapping, source, destination){

      destination={}; // This could be an array too

      for(var key in source)
      {
         var child=_dynamicMapper(mapping[key], source[key], destination[mapping[key]]);
      }
   };

   // export
   ((typeof(module)!=="undefined" ? (module.exports=JSONMapping) : ((typeof(define)!=="undefined" && define.amd) ? define(function(){ return JSONMapping; }) : false)));

   return JSONMapping;
})();
