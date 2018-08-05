var makerjs = require('makerjs');
var Heart = require('makerjs-heart');

function HeartStack(r, a, count) {

  var heart = new Heart(r, a);

  var measure = makerjs.measure.modelExtents(heart);
  heart.origin = [5 - measure.low[0], 0]; 
  makerjs.model.originate(heart);
  
  var height = measure.high[1] - measure.low[1];

  var sprue = new makerjs.models.Rectangle(6, 1);

  makerjs.model.combine(heart, sprue);

  var sprueHeart = {
    models: {
      heart: heart,
      sprue: sprue
    }
  };
  
  function Column() {
	
    this.models = {};
    
    for (var i = 0; i < count; i++) {
      var clone = makerjs.cloneObject(sprueHeart);
      clone.origin = [0, i * height];

      this.models['h' + i] = clone;
    }
    
	makerjs.model.originate(this);    
  }

  var column = new Column();
  var column2 = makerjs.model.mirror(column, true, false);
  
  var mainSprue = new makerjs.models.Rectangle(2, height * (count - 1) + 1);
  mainSprue.origin = [-1, 0];
  makerjs.model.originate(mainSprue);
  
  makerjs.model.combine(column, mainSprue);
   
  this.models = {
    main: mainSprue,
    column1: column
  };
  
  makerjs.model.combine(this, column2);
  
  this.models.column2 = column2;
  
}

HeartStack.metaParameters = [
    { title: "radius", type: "range", min: .01, max: 100, value: 10 },
    { title: "angle", type: "range", min: 60, max: 120, value: 90 },
    { title: "count", type: "range", min: 1, max: 20, value: 5 }
];

module.exports = HeartStack;
