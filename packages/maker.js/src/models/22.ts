var makerjs = require('makerjs');

function cardboard(l, w, h,h2,t) {

  this.models = {
    box: new makerjs.models.Rectangle(l, w),
    left: new makerjs.models.ConnectTheDots(false, [[0,0],[-h,0],[-h2,w],[0,w]]),
    rigth: new makerjs.models.ConnectTheDots(false, [[0,0],[h,0],[h2,w],[0,w]]),
    bottom: new makerjs.models.ConnectTheDots(false, [[0,0],[0,-h],[l+2*t,-h],[l+2*t,0]]),   
    top: new makerjs.models.ConnectTheDots(false, [[0,0],[0,h2],[l+2*t,h2],[l+2*t,0]]),  
  };

   this.models.box.origin = [h, h];
   this.models.left.origin = [h, h];
   this.models.rigth.origin = [h+l, h];
   this.models.bottom.origin = [h-t, h];  
   this.models.top.origin = [h-t, h+w];  
   this.models.box.layer = "silver";
  
  this.units = makerjs.unitType.Millimeter;
}

cardboard.metaParameters = [
  { title: "Длина", type: "range", min: 30, max: 700, value: 50 },
  { title: "Ширина", type: "range", min: 30, max: 700, value: 50 },
  { title: "Высота", type: "range", min: 10, max: 400, value: 10 },
  { title: "Высота 2", type: "range", min: 0, max: 200, value: 5 }, 
  { title: "Толщина картона", type: "range", min:0, max: 4, value: 2, step:0.05}
];

module.exports = cardboard;
