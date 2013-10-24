/***
 * Method taken from Brian Grinstead and modified the return 
 * of rounded r,g and b.
 * @https://github.com/bgrins/TinyColor/blob/master/tinycolor.js
 ***/
(function(angular) {
  var ngColorPicker = angular.module('directive.colorPicker', []);
  
  function hsvToRgb(h, s, v) {
    h*=6;
    var i = ~~h,
      f = h - i,
      p = v * (1 - s),
      q = v * (1 - f * s),
      t = v * (1 - (1 - f) * s),
      mod = i % 6,
      r = [v, q, p, p, t, v][mod] * 255,
      g = [t, v, v, q, p, p][mod] * 255,
      b = [p, p, t, v, v, q][mod] * 255;
      
      return [~~r, ~~g, ~~b, "rgb("+ ~~r + "," + ~~g + "," + ~~b + ")"];
  }
  
  function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
    
  ngColorPicker.directive('ngColorCircle', ['$timeout', function($timeout) {
    return {
      restrict  : 'E',
      replace   : true,
      scope     : '@=',
      template  : '<div>'
      +             '<canvas id="colorCircle">'
      +             '</canvas>'
      +           '</div>',
      compile: function compile(tElement, tAttrs, transclude) {
        return {
          pre: function preLink(scope, iElement, iAttrs, controller) {
            var canvas        = document.getElementById("colorCircle"),
                context       = canvas.getContext('2d'),
                width         = canvas.width = iAttrs.width ||  300,
                height        = canvas.height = iAttrs.height || 300,
                imageData     = context.createImageData(width, height),
                pixels        = imageData.data,
                oneHundred    = 100,
                two55         = 255,
                circleOffset  = 10,
                diameter      = width - circleOffset * 2,
                wheelPixel    = circleOffset * 4 * width + circleOffset * 4;
            
            iElement.css({
              width: width,
              height: height
            });
            
            scope.radius            = diameter / 2;
            scope.radiusPlusOffset  = scope.radius + circleOffset;
            scope.radiusSquared     = scope.radius * scope.radius;
            scope.currentY          = oneHundred;
            scope.currentX          = -scope.currentY;
            
            for (y = 0; y < height; y++) {
              for (x = 0; x < width; x++) {
                var rx  = x - scope.radius,
                    ry  = y - scope.radius,
                    d   = rx * rx + ry * ry,
                    rgb = hsvToRgb((Math.atan2(ry, rx) + Math.PI) / (Math.PI * 2),
                          Math.sqrt(d) / scope.radius, 1); 
                
                pixels[wheelPixel++] = rgb[0];
                pixels[wheelPixel++] = rgb[1];
                pixels[wheelPixel++] = rgb[2];
                pixels[wheelPixel++] = d > scope.radiusSquared ? 0 : two55;
              }
            }
            
            context.putImageData(imageData, 0, 0);
          },
          post: function postLink(scope, iElement, iAttrs, controller) { 
            $(iElement).click(function(event) {
              scope.currentX = event.pageX - this.offsetLeft - scope.radiusPlusOffset || scope.currentX;
              scope.currentY = event.pageY - this.offsetTop - scope.radiusPlusOffset || scope.currentY;
              
              var theta = Math.atan2(scope.currentY, scope.currentX),
                  d = scope.currentX * scope.currentX + scope.currentY * scope.currentY;
              
              if (d > scope.radiusSquared) {
                scope.currentX = scope.radius * Math.cos(theta);
                scope.currentY = scope.radius * Math.sin(theta);
                theta = Math.atan2(scope.currentY, scope.currentX);
                d = scope.currentX * scope.currentX + scope.currentY * scope.currentY;
              }
              
              var color = hsvToRgb((theta + Math.PI) / (Math.PI * 2),
                Math.sqrt(d) / scope.radius, 1);
              var hex = rgbToHex(color[0], color[1], color[2]);
              
              $timeout(function(){
                scope.$parent[iAttrs.modelObject][iAttrs.modelProperty] = hex;                
              });
            });
          }
        };
      }
    };
  }]);

  ngColorPicker.directive('ngColorPicker', [function() {
    return {
      restrict: 'E',
      replace: true,
      scope : '@=',
      template: '<table>'
      +           '<tr>'
      +           '<td ng-repeat="color in colorList">'
      +             '<div style="width: 8px; height: 8px; border: {{color.select}}px solid #000; padding: 5px; background-color: {{color.color}}" ng-click="selectColor(color)">'
      +             '</div>'
      +           '<td>'
      +           '</tr>'
      +         '</table>',
      compile: function compile(tElement, tAttrs, transclude) {
        return {
          post: function postLink(scope, iElement, iAttrs, controller) { 
            scope.modelObject   = iAttrs.modelObject;
            scope.modelProperty = iAttrs.modelProperty;
            scope.colorList = [];
            angular.forEach(colors, function(color) {
              scope.colorList.push({
                color : color,
                select : 1
              });
            });
          }
        };
      },
      controller: function($scope, $element, $timeout) {
        $scope.selectColor = function(color) {
          for (var i = 0; i < $scope.colorList.length; i++) {
            $scope.colorList[i].select = 1;
            if ($scope.colorList[i] === color) {
              $scope[$scope.modelObject][$scope.modelProperty] = color.color;
              $scope.colorList[i].select = 2;
            }
          }
        };
      }
    };
  }]);
})(window.angular);
