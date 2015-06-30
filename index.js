var JSONPatch=require("./src/json-patch.js");

// export
(typeof(module)!=="undefined" ? (module.exports=JSONPatch) : ((typeof(define)!=="undefined" && define.amd) ? define(function(){ return JSONPatch; }) : (window.JSONPatch=JSONPatch)));
