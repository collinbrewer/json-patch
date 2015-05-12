# JSON Mapping

JSON Mapping is a spec and utility for mapping values from one form to another.

It's purpose is to allow flexibility in otherwise rigid systems in addition to offering a serializable structure for defining how data is converted.

It's also pretty powerful.  A simple mapping can allow you to index an array by a key very simply:

```javascript

var array=[
   {name:"Chris", email:"chris@server.com"},
   {name:"Eric", email:"eric@server.com"}
];

var mapping={
   "sourcePath":".", // the current data
   "destinationPath":"email" // ...is mapped to name:{}
};

var indexed=JSONMapping.toMapping(mapping, array);
```

This would yield:

```javascript
{
   "chris@server.com": {name:"Chris", email:"chris@server.com"},
   "eric@server.com": {name:"Eric", email:"eric@server.com"}
}
```


## Spec

### Mapping

#### sourcePath
The source path.

#### destinationPath
The destination path.

### Object Mapping
To map an object's keys, a source key is provided along with a destination key.

``` javascript
{
   sourcePath: "old",
   destinationPath: "new"
}
```

### Array Mapping
Mapping an array is a bit more complicated.

```javascript
{
   sourcePath: 0, // move the value from index 0
   destinationPath: 1 // ...to index 1
}
```

### Mixed Mapping
It's also possible to map across boundaries using paths.

```javascript
{
   sourcePath: "0", // [{name:"Chris", email:"chris@server.com"}]
   destinationPath: "$source.email", // {}
}
```

### Dynamic Typing - NIMP
For those ever-annoying special cases, a custom mapping function can be used.

```javascript
{
   to: function(source, sourceBaseKeyPath, sourceKey){
      return "destinationKey";
   },

   from: function(destination, destinationBaseKeyPath, destinationKey){
      return "sourceKey";
   }
}
```

## Utility
The utility defines a few simple methods.

### toMapping
Converts data from the source form to destination form in the mapping.

### fromMapping
Converts data to the destination form from the source form in the mapping.

### inverse
Inverses the source and destination mapping.
