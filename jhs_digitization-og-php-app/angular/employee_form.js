var app = angular.module('drm_app', []);
var base_url="http://hashtaglabs.in/staging/drm/";
var prefixes=["Mr.","Mrs.","Shri"];
var genders=["Male","Female"];

app.controller('drmCtrl', function($scope, $http) {
	    $scope.employee_frm=true;
	    
	    
		$scope.prefixes = prefixes;
		$scope.prefix=prefixes[0];
		$scope.gender=genders[0];
		$scope.insertdata = function() {
			
		$http.post(base_url+"user/make_employee/",{'employee_code':$scope.employee_code,'prefix':$scope.prefix,'employee_name':$scope.employee_name,'gender':$scope.gender,'dob':$scope.dob,'email':$scope.email,'mobile':$scope.mobile,'pan':$scope.pan,'aadhar':$scope.aadhar}, {headers : {
        'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
		}}).then(function(success) {
		alert(success.data);
		if(success.data=='Success')
		{
		
        $("#error").show(500);
		$scope.employee_code='';
		$scope.prefix='';
		$scope.employee_name='';
		$scope.gender='';
		$scope.dob='';
		$scope.email='';
		$scope.mobile='';
		$scope.pan='';
		$scope.aadhar='';
		$("#error").hide(500);
		
		}
		else{
			
			$scope.error=success.data;
		}
		
		});

		};
		
	
	
	      $scope.form = [];
	      $scope.files = [];
	      $scope.files2 = [];
	      $scope.files3 = [];
          

	      $scope.submitdocs = function() {
			
	      $scope.form.image = $scope.files[0];


	      	$http({
			  method  : 'POST',
			  url     : base_url+'user/uploadservice',
			  processData: false,
			  transformRequest: function (data) {
			      var formData = new FormData();
			      formData.append("image", $scope.form.image); 
				  
			      return formData;  
			  },  
			  data : $scope.form,
			  headers: {
			         'Content-Type': undefined
			  }
		   }).then(function(data){
			    $("#service").val(null);
		        alert("Image Uploaded");
				 
				$scope.doc1=false;
				$scope.doc2=true;
		   });


	      };
		  
		  
		  
		  
		  
		  
	      $scope.submitdocs2 = function() {
			
	      $scope.form.image = $scope.files[0];


	      	$http({
			  method  : 'POST',
			  url     : base_url+'user/uploadservice2',
			  processData: false,
			  transformRequest: function (data) {
			      var formData = new FormData();
			      formData.append("image", $scope.form.image); 
				  
			      return formData;  
			  },  
			  data : $scope.form,
			  headers: {
			         'Content-Type': undefined
			  }
		   }).then(function(data){
			    
		         alert("Image Uploaded");
				  $("#service2").val(null);
				 $scope.doc2=false;
				 $scope.doc3=true;
		   });


	      };
		  
		  
		  
		  
		  
		  
		  
	      $scope.submitdocs3 = function() {
			
	      $scope.form.image = $scope.files[0];


	      	$http({
			  method  : 'POST',
			  url     : base_url+'user/uploadservice3',
			  processData: false,
			  transformRequest: function (data) {
			      var formData = new FormData();
			      formData.append("image", $scope.form.image); 
				  
			      return formData;  
			  },  
			  data : $scope.form,
			  headers: {
			         'Content-Type': undefined
			  }
		   }).then(function(data){
			   $("#service3").val(null);
		          alert("Image Uploaded");
					$scope.doc1=false;
					$scope.doc2=false;
					$scope.doc3=false;
					$scope.employee_frm=true;
					$scope.doc_frm=false;
		   });


	      };


	      $scope.uploadedFile = function(element) {
		    $scope.currentFile = element.files[0];
		    var reader = new FileReader();


		    reader.onload = function(event) {
		      $scope.image_source = event.target.result
		      $scope.$apply(function($scope) {
		        $scope.files = element.files;
		      });
		    }
                    reader.readAsDataURL(element.files[0]);
		  }
		  
		  
		  
		  
		    $scope.uploadedFile2 = function(element) {
		    $scope.currentFile = element.files[0];
		    var reader = new FileReader();


		    reader.onload = function(event) {
		      $scope.image_source2 = event.target.result
		      $scope.$apply(function($scope) {
		        $scope.files = element.files;
		      });
		    }
                    reader.readAsDataURL(element.files[0]);
		  }
		  
		  
		  
		    $scope.uploadedFile3 = function(element) {
		    $scope.currentFile = element.files[0];
		    var reader = new FileReader();


		    reader.onload = function(event) {
		      $scope.image_source3 = event.target.result
		      $scope.$apply(function($scope) {
		        $scope.files = element.files;
		      });
		    }
                    reader.readAsDataURL(element.files[0]);
		  }
	
  /////////////////////////// for pagination //////////////////////////////
  

 //////////////////////////////////////////////////////////////////////// 
});

