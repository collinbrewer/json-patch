var JSONMapping=require("./src/json-mapping.js");

// export
((typeof(module)!=="undefined" ? (module.exports=JSONMapping) : ((typeof(define)!=="undefined" && define.amd) ? define(function(){ return JSONMapping; }) : false)));
