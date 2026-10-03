<style>
.labeltext{
	font-weight:bold 
}
.error{
	 color:red;
	 font-weight:bold;
}
.imageThumb {
    width: 177px;
    height: auto;
    float: left !important;
    border: 2px solid #eeeeee;
    margin-top: 6px;
}
.thumbs span {
    font-weight: bold;
    margin-top: 3px;
}
.thumbs{
	width: 190px;
	height: 190px;
    float: left;
    border: 1px solid #eeeeee;
    padding: 5px;
    margin: 5px;
    text-align: center; 
}

.gallery
{
    display: inline-block;
    margin-top: 20px;
}
a.thumbnail{
	
	margin-bottom: 5px !important;
	
}
a.thumbnail.fancybox img
{
    height: 100%;
    width: 100%;
}

.imgset a.remove-buton {
    text-align: center;
    margin: 0 auto;
    float: left;
    width: 100%;
}

a.thumbnail.fancybox img {
    height: initial;
    width: initial;
}
img.imgherea {
    object-fit: cover;
    height: 100px !important;
    overflow: hidden;
}
#image_preview .thumbs img{
  object-fit: cover;
    height: 100px !important;
    overflow: hidden;

}

</style>

<div class="right_col">
          <div class="">
            <div class="page-title">
              <div class="title_left">
                <h3>Upload Service book</h3>
              </div>

         
            </div>
            <div class="clearfix"></div>
<?php
if($this->session->flashdata('item') != '') {
$message = $this->session->flashdata('item');
?>
<div class="alert alert-<?php echo $message['class'] ?>"><?php echo $message['message']; 
?> </div><?php } ?>
        
        
<div class="row">
			
<div class="col-md-12 col-sm-12 col-xs-12">
<div class="x_panel">
<div class="x_title">
<h2>Upload Service book For <span class="nameheading"><?php echo $this->User_model->getval("drm_employee","emp_id",$this->uri->segment(3),'employee_name').' - '.$this->User_model->getval("drm_employee","emp_id",$this->uri->segment(3),'employee_code'); ?></span></h2>
<ul class="nav navbar-right panel_toolbox">
<li><a class="collapse-link"><i class="fa fa-chevron-up"></i></a></li>
</ul>
<div class="clearfix"></div></div>
                  
<div class="x_content">
<div class="error" ng-bind="error" style="text-align:center"></div>
<form method="post" action="<?php echo base_url()?>user/uploadservicebook/<?php echo $this->uri->segment(3)?>" enctype="multipart/form-data">               
<div class="item form-group">
	<div class="col-md-12 col-sm-6 col-xs-12">
	<div class="labeltext">Select Pages to Be Upload</div>
		<input id="sbook" class="form-control col-md-7 col-xs-12"  name="sbook[]" type="file" multiple onchange="preview_image();" required="required">
	</div>
</div>
		<input type="hidden" name="uploadedages" id="uploadedages" class="form-control" value="<?php echo $this->User_model->getalluploadeservicebookid($this->uri->segment(3));?>">	

<div id="image_preview"></div>
				  
<div class="item form-group" style="clear:both">


	<input type="submit" class="btn btn-success" onClick="return chalculate()" value="Upload">
</div>

</form>
</div>
</div>
</div>

<div class="col-md-12 col-sm-12 col-xs-12">
	<div class='list-group gallery' style="width:100%">
	<?php
     foreach($sb as $value){?>
		<div class='col-sm-4 col-xs-6 col-md-3 col-lg-3' style="width:150px;">
			<div class="imgset">
				<a class="thumbnail fancybox" rel="ligthbox" style="height:auto !important" href="<?php echo base_url();?>uploads/<?php echo $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code;?>/service_book/<?php echo $value->filename;?>">
					<p><?php echo "Page no ".$value->pageno;?></p>                  
					<img class="imgherea" src="<?php echo base_url();?>uploads/<?php echo $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code;?>/service_book/<?php echo $value->filename;?>" title="<?php echo "Page no".$value->pageno;?>">
				</a>
				
				<a href="<?php echo base_url();?>user/deleteservicebook/<?php echo $value->sb_id;?>/<?php echo $this->uri->segment(3);?>" class="remove-buton" onclick="return confirm('Are you sure want to delete?')">
					<button type="button" class="btn btn-danger btn-sm">
                                            <span class="glyphicon glyphicon-remove"></span> Remove 
					</button>
				</a>
			</div>
		</div>
	<?php }?>
	</div>
</div>
</div>

</div></div></div>                        

<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js"></script>
<script>

 

function preview_image() 
{
    
 var total_file=document.getElementById("sbook").files.length;
 for(var i=0;i<total_file;i++)
 {
  $('#image_preview').append("<div class='thumbs'><span style='float: left;'>Enter Page No</span><input type='number' id='tos' name='pageno[]' class='tbno' style='width:50px;' value='"+(i+1)+"'><img src='"+URL.createObjectURL(event.target.files[i])+"'  class='imageThumb'><input type='checkbox' value='"+i+"' style='float:left' checked name='check[]'></div>");
 }
}
</script>



<script>
function fileValidation(){
    var fileInput = document.getElementById('sbook');
    var filePath = fileInput.value;
    var allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif)$/i;
    if(!allowedExtensions.exec(filePath)){
        alert('Please upload file having extensions .jpeg/.jpg/.png/.gif only.');
        fileInput.value = '';
        return false;
    }else{
        //Image preview
        if (fileInput.files && fileInput.files[0]) {
            var reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('imagePreview').innerHTML = '<img src="'+e.target.result+'"/>';
            };
            reader.readAsDataURL(fileInput.files[0]);
        }
    }
}

$(document).ready(function(){
    $(".fancybox").fancybox({
        openEffect: "none",
        closeEffect: "none"
    });

    // $('#sbook').change(function () {
    //     alert("ab");
    //    LoadFile("myFile");//function to do processing of file.
    //    $('#myFile').val('');// set the value to empty of myfile control.
    // });
});
</script>



<script>
function chalculate(id)
{
var page=[];
var pages=[];


 var pagenos=$("#uploadedages").val();

 if(pagenos.search(",")>=1)
 {
     pages=$("#uploadedages").val().split(",");	
 }
 else
 {
     pages=[pagenos];	 
 }
 

 
 
 $("input[name = 'pageno[]']").each(function(){
	 
	 var i=pages.indexOf($(this).val(),pages);
	 
	
	 if(i>=0)
	 {
		 page.push($(this).val());
		 
	 }
 });
 

  if(page.length>=1)
 { 
 return confirm("Page no "+page+" already available! Do you want to update new page?");

 }
 
 
}
</script>



<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/fancybox/2.1.5/jquery.fancybox.min.css" media="screen">
<script src="//cdnjs.cloudflare.com/ajax/libs/fancybox/2.1.5/jquery.fancybox.min.js"></script>

<script type="text/javascript">
function valueChanged()
{
    if($('.page_no').is(":checked"))
	$(".answer").css("display", "block");   
        
    else
        $(".answer").hide();
}
</script>