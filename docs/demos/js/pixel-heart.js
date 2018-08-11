var makerjs = require('makerjs');

/**
     _______ _________          _______  _       
    (  ____ )\__   __/|\     /|(  ____ \( \      
    | (    )|   ) (   ( \   / )| (    \/| (      
    | (____)|   | |    \ (_) / | (__    | |      
    |  _____)   | |     ) _ (  |  __)   | |      
    | (         | |    / ( ) \ | (      | |      
    | )      ___) (___( /   \ )| (____/\| (____/\
    |/       \_______/|/     \|(_______/(_______/

              _______  _______  _______ _________
    |\     /|(  ____ \(  ___  )(  ____ )\__   __/
    | )   ( || (    \/| (   ) || (    )|   ) (   
    | (___) || (__    | (___) || (____)|   | |   
    |  ___  ||  __)   |  ___  ||     __)   | |   
    | (   ) || (      | (   ) || (\ (      | |   
    | )   ( || (____/\| )   ( || ) \ \__   | |   
    |/     \|(_______/|/     \||/   \__/   )_(   
                                            
*/

// "path" is an array of movements needed to make the heart. It alternates horizontal and vertical
// movements. Each movement is the amount specified in the array, for example `-3` would be moving
// 3 units in the negative direction. The starting point of the heart is the leftmost edge at the
// top of the vertical 3 side (see `STARTING_POINT`).
var path = [1, 1, 1, 1, 3, -1, 3, 1, 3, -1, 1, -1, 1, -3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 3];

var HEART_WIDTH = 13;	// corresponds to the width of the model when built from `path` above
var STARTING_POINT = [0, 9];	// starting point so the heart is located properly in space

/**
 * Builds an array of points that define a model by generating points 
 * from the `path` defined above.
 */
function PixelWalker(firstPoint, pixel_path) {

    // go clockwise starting first point
    var points = [];
    points.push(firstPoint);

    var moveHorizontal = true;	// alternate horizontal and vertical movements to form pixel heart

    pixel_path.forEach(function (p) {

        var previous_point = points[points.length - 1];
        var point_to_add;

        if (moveHorizontal) {
            point_to_add = [p, 0];
        } else {
            point_to_add = [0, p];
        }
        var e = makerjs.point.add(previous_point, point_to_add);
        points.push(e);

        // flip direction each time
        moveHorizontal = !moveHorizontal;
    });

    return points;
}

/** 
 * Builds a pixel heart model and scale it to the specified input width.
 */
function Heart(desired_width) {

    var points = PixelWalker(STARTING_POINT, path);
    var pathModel = new makerjs.models.ConnectTheDots(true, points);
    if (typeof desired_width != 'undefined') {
        var scale = desired_width / HEART_WIDTH;
        makerjs.model.scale(pathModel, scale);
    }
    return pathModel;
}

/**
 * Define input properties for when this module is used within the maker.js playground.
 * See http://maker.js.org/playground
 */
Heart.metaParameters = [
    { title: "Width", type: "range", min: 1, max: 130, value: 13 }
];

module.exports = Heart;
