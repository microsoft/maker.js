var makerjs = require('makerjs');

function dogbonePolygon(number_of_sides, radius, offset_angle, radius_on_flats, dogbone) {

  var polygon = new makerjs.models.Polygon(number_of_sides, radius, offset_angle, radius_on_flats);
  
  var chain = makerjs.model.findSingleChain(polygon);
  
  var bones = makerjs.chain.dogbone(chain, dogbone);
    
  this.models = {
    polygon: polygon,
    bones: bones
  };

}

dogbonePolygon.metaParameters = makerjs.models.Polygon.metaParameters.concat([
  { title: "dogbone", type: "range", min: 0, max: 20, value: 5 }
]);

module.exports = dogbonePolygon;
