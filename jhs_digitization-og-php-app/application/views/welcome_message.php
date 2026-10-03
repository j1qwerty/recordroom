<!DOCTYPE html>
<html>
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.6.4/angular.min.js"></script>
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">

<body>


<div ng-app="myApp" ng-controller="customersCtrl" class="container"> 
<form >

Book Name:-<input type="text" ng-model="bname" />
Book Author:-<input type="text" ng-model="bauthor" />
Book Price:-<input type="text" ng-model="bprice" />
Book Language:-<input type="text" ng-model="blanguage" />
 <input type="hidden" ng-model="id">
<input type="button" value="Submit" ng-click="insertdata()" />
</form>

<div class="container">
<div class="row">
<div class="">&nbsp;</div>
  <div class="col-md-12" ng-repeat="x in myData">
  <div class="row">
    <div class="col-md-2">{{ x.book_name }}</div> 
	<div class="col-md-2">{{ x.book_author }}</div>
	<div class="col-md-2">{{ x.book_price }}</div>
	<div class="col-md-2">{{ x.book_language }}</div>
	<div class="col-md-1">
	     <button class="btn btn-success btn-xs" ng-click="update_data(x.id, x.book_name, x.book_author, x.book_price, x.book_language)">Edit</button>
	</div>
	<div class="col-md-1">
		 <button class="btn btn-danger btn-xs" ng-click="delete_data(x.id )">Delete</button>
    </div>
   </div>
   <div class="">&nbsp;</div>
</div>
</div>

</div>

<script>
var app = angular.module('myApp', []);
app.controller('customersCtrl', function($scope, $http) {
	
		$scope.insertdata = function() {
		$http.post("<?php echo base_url(); ?>index.php/welcome/insert/",{'id':$scope.id,'bname':$scope.bname,'bauthor':$scope.bauthor,'bprice':$scope.bprice,'blanguage':$scope.blanguage}).then(function(success) {

		$scope.message = "Inserted Successfully!";
		$http.get("<?php echo $this->config->base_url();?>index.php/welcome/getusers").then(function (response) {

		$scope.myData = response.data;
		});
		});

		}
		
		
		$scope.delete_data = function(id) {
		
        if (confirm("Are you sure you want to delete?")) {
            $http.post("<?php echo $this->config->base_url();?>index.php/welcome/deletebook", {'id': id}).then(function(data) {
                   $http.get("<?php echo $this->config->base_url();?>index.php/welcome/getusers").then(function (response) {

		$scope.myData = response.data;
		});
                });
        } else {
            return false;
        }
    }
	
	$scope.update_data = function(id,book_name,book_author,book_price,book_language) {
	
        $scope.id = id;
        $scope.bname = book_name;
        $scope.bauthor = book_author;
        $scope.bprice = book_price;
        $scope.blanguage = book_language;
    }
	
  $http.get("<?php echo $this->config->base_url();?>index.php/welcome/getusers").then(function (response) {

      $scope.myData = response.data;
  });
});
</script>

</body>
</html>