(function () {
  angular.module("ShoppingListComponentApp", [])
  .controller("ShoppingListController", ShoppingListController)
  .service("WeightLossFilterService", WeightLossFilterService)
  .factory("ShoppingListFactory", ShoppingListFactory)
  .component("shoppingList", {
    templateUrl: "shoppingList.html",
    controller: ShoppingListComponentController,
    bindings: {
      items: "<",
      title: "@title",
      onRemove: "&"
    }
  })
  .component("loadingSpinner", {
    templateUrl: "loadingSpinner.html",
    controller: LoadingSpinnerController
  });

  LoadingSpinnerController.$inject = ["$rootScope"];
  function LoadingSpinnerController($rootScope) {
    $rootScope.$on(function (event, data) {
      console.log(event);
      console.log(data);
    });
  }

  ShoppingListComponentController.$inject = ["$rootScope", "$element", "$q", "WeightLossFilterService"];
  function ShoppingListComponentController($rootScope, $element, $q, WeightLossFilterService) {
    var $ctrl = this;
    var totalItems;
    $ctrl.cookiesInList = function () {
      for (var i = 0; i < $ctrl.items.length; i++) {
        var name = $ctrl.items[i].name;
        if (name.toLowerCase().indexOf("cookie") !== -1) {
          return true;
        }
      }
      return false;
    };

    $ctrl.remove = function (myIndex) {
      $ctrl.onRemove({ index: myIndex });
    };

    $ctrl.$onInit = function () {
      totalItems = 0;
    };

    $ctrl.$doCheck = function () {
      console.log("Inside");
      if ($ctrl.items.length !== totalItems) {
        totalItems = $ctrl.items.length;
        $rootScope.$broadcast("shoppingList: processing", { on: true});
        var promises = [];
        for (var i = 0; i < $ctrl.items.length; i++) {
          promises.push(WeightLossFilterService.checkName($ctrl.items[i].name));
        }

        $q.all(promises)
        .then(function (result) {
          // Hide Warning Element
          var hideWarningElement = $element.find("div.error");
          hideWarningElement.slideUp(900);
        })
        .catch(function (result) {
          // Show Warning Element
          var showWarningElement = $element.find("div.error")
          showWarningElement.slideDown(900);
        })
        .finally(function () {
          $rootScope.$broadcast("shoppingList: processing", { on: false });
        });
      }
    };
  }

  ShoppingListController.$inject = ["ShoppingListFactory"];
  function ShoppingListController(ShoppingListFactory) {
    var list = this;
    list.itemName = "";
    list.itemQuantity = "";
    var shoppingList = ShoppingListFactory();
    list.items = shoppingList.getItems();
    var origTitle = "Shopping List #1";
    list.title = list.title = origTitle + " (" + list.items.length + " items )";
    list.addItem = function () {
      shoppingList.addItem(list.itemName, list.itemQuantity);
      list.title = origTitle + " (" + list.items.length + " items )";
    };

    list.removeItem = function (index) {
      list.lastRemoved = "Last Removed Item is: " + list.items[index].name;
      shoppingList.removeItem(index);
      list.title = origTitle + " (" + list.items.length + " items )";
    };
  }

  function ShoppingListService(maxItems) {
    var service = this;
    var items = [];

    service.addItem = function (itemName, itemQuantity) {
      if ((maxItems === undefined) || (maxItems != undefined && items.length < maxItems)) {
        var item = {
          name: itemName,
          quantity: itemQuantity
        };
        items.push(item);
      } else {
        throw new Error ("Max Items reached");
      }
    };

    service.getItems = function () {
      return items;
    };

    service.removeItem = function (index) {
      items.splice(index, 1);
    };
  }

  WeightLossFilterService.$inject = ["$q", "$timeout"];
  function WeightLossFilterService($q, $timeout) {
    var service = this;

    service.checkName = function (name) {
      var deferred = $q.defer();
      var result = {
        message: ""
      }
      $timeout(function () {
        if (name.toLowerCase().indexOf("cookie") === -1) {
          deferred.resolve(result);
        } else {
          deferred.reject(result);
        }
      }, 3000)
      return deferred.promise;
    };
  }

  function ShoppingListFactory() {
    var factory = function (maxItems) {
      return new ShoppingListService(maxItems);
    };
    return factory;
  }
})();
