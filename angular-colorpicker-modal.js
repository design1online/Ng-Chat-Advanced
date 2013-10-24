/***
 * File: angular-colorpicker-modal.js
 * Author: Jade Krafsig
 * Source: design1online.com, LLC
 * License: GNU Public License
 ***/

/***
 * Purpose: modal template controller
 * Preconditions: $rootScope, $modal and ui-bootstrap module
 * Postconditions: creates a modal window using the specified template
 *  and broadcasts the selected color back to the main controller when
 *  the window is closed
 ***/
var ColorPickerCtrl = function ($rootScope, $scope, $modal) {
  
  $scope.open = function () {
    $scope.color = "#000000";
      
    var modalInstance = $modal.open({
      templateUrl: 'fontcolor.html',
      controller: 'ColorpickerModalCtrl'
    });
    
    //when the color changes broadcast back to the main chat controller
    modalInstance.result.then(function (data) {
      $scope.color = data.color;
      $rootScope.$broadcast('colorChange',  $scope.color);
    });
  }
}

//create a modal popup window and pass it back to the modal parent controller
/***
 * Purpose: modal controller
 * Preconditions: instance of the modal being created
 * Postconditions: functionality defined for all modals created of $modalInstance
 ***/
var ColorpickerModalCtrl = function ($scope, $modalInstance) {
  $scope.colorpicker = {};
  $scope.colorpicker.color = "#000000";
  
  $scope.ok = function () {
    $modalInstance.close({color: $scope.colorpicker.color});
  };
};
