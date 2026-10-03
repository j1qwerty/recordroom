  <style>
  p.updatedon {
    font-size: 12px !important;
    font-family: Arial,Helvetica,sans-serif !important;
    text-align: center;
}

.b-wrap {
	height: 510px !important;
}
.book_wrapper img {
	margin: 10px auto;
	width: 332px;
	padding: 4px;
}
.manage-height {
	min-height: 465px;
}
.b-counter .cufon {
	right: -160px;
	top: -4px;
}
.book_wrapper img {
	margin: 0!important;
	width: 360px!important;
	padding: 4px;
	border: 1px solid #ddd;
	-moz-box-shadow: 1px 1px 1px #fff;
	-webkit-box-shadow: 1px 1px 1px #fff;
	box-shadow: 1px 1px 1px #fff;
	height: 465px!important;
}
.managemyiwdutg{
	width:70% !important;
}
</style>      
<div class="right_col">
<div class=""><div class="page-title"><div class="title_left managemyiwdutg">
<h3>View Service book of <span class="nameheading"><?php echo $this->User_model->getval("drm_employee","emp_id",$this->uri->segment(3),'employee_name').' - '.$this->User_model->getval("drm_employee","emp_id",$this->uri->segment(3),'employee_code'); ?></span></h3>
</div>

<div style="float:right;"><?php if(count($this->User_model->getallservicebook($this->uri->segment(3)))>=1) { ?>
<a href="<?php echo base_url(); ?>user/generate_pdf/<?php echo 'SB_'.$this->uri->segment(3); ?>" class="btn btn-info">Save as PDF</a>
<?php } ?><a class="btn btn-primary" href="javascript:void(0);" onClick="history.back();">Back</a></div>
</div>

<div class="clearfix"></div>
<div class="row">
<div class="col-md-12 col-sm-12 col-xs-12">

		<script src="<?php echo base_url();?>booklet/jquery.easing.1.3.js" type="text/javascript"></script>
		<script src="<?php echo base_url();?>booklet/jquery.booklet.1.1.0.min.js" type="text/javascript"></script>

		<link href="<?php echo base_url();?>booklet/jquery.booklet.1.1.0.css" type="text/css" rel="stylesheet" media="screen" />
		<link rel="stylesheet" href="<?php echo base_url();?>css/style.css" type="text/css" media="screen"/>

		<script src="<?php echo base_url();?>cufon/cufon-yui.js" type="text/javascript"></script>
		<script src="<?php echo base_url();?>cufon/ChunkFive_400.font.js" type="text/javascript"></script>
		<script src="<?php echo base_url();?>cufon/Note_this_400.font.js" type="text/javascript"></script>
		<script type="text/javascript">
			Cufon.replace('h1,p,.b-counter');
			Cufon.replace('.book_wrapper a', {hover:true});
			Cufon.replace('.title', {textShadow: '1px 1px #C59471'});
			Cufon.replace('.reference a', {textShadow: '1px 1px #C59471'});
			Cufon.replace('.loading', {textShadow: '1px 1px #000'});
		</script>
	
		<div class="book_wrapper">
			<a id="next_page_button"></a>
			<a id="prev_page_button"></a>
			<div id="loading" class="loading">Loading pages...</div>
			<div id="mybook" style="display:none;">
				<div class="b-load">
					
					<?php foreach($this->User_model->getallservicebook($this->uri->segment(3)) as $sb)
					{?>
					<div class="mybooksource">
						<div class="manage-height">
						<img data-toggle="modal" class="thumb" id="<?php echo $sb->sb_id?>" data-target="#myModal" src="<?php echo base_url();?>uploads/<?php echo $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code; ?>/service_book/<?php echo $sb->filename?>" alt=""/>
						</div>
						<p class="updatedon">Last Updated on : <?php echo date('d-m-Y H:i:s', strtotime($sb->uploaded_at)); ?></p>
					
					</div>
					
					<?php } ?>
					
					
				</div>
			</div>
		</div>
        <div>
           
		</div>
<!------------------------------- Modal --------------------->
<div class="modal fade" id="myModal" role="dialog">
    <div class="modal-dialog">
    
      <!-- Modal content-->
      <div class="modal-content">
        
      </div>
      
    </div>
  </div>
  
</div>
        <!-- The JavaScript -->

        <script type="text/javascript">
			$(function() {
				var $mybook 		= $('#mybook');
				var $bttn_next		= $('#next_page_button');
				var $bttn_prev		= $('#prev_page_button');
				var $loading		= $('#loading');
				var $mybook_images	= $mybook.find('img');
				var cnt_images		= $mybook_images.length;
				var loaded			= 0;
				//preload all the images in the book,
				//and then call the booklet plugin

				$mybook_images.each(function(){
					var $img 	= $(this);
					var source	= $img.attr('src');
					$('<img/>').load(function(){
						++loaded;
						if(loaded == cnt_images){
							$loading.hide();
							$bttn_next.show();
							$bttn_prev.show();
							$mybook.show().booklet({
								name:               null,                            // name of the booklet to display in the document title bar
								width:              800,                             // container width
								height:             500,                             // container height
								speed:              600,                             // speed of the transition between pages
								direction:          'LTR',                           // direction of the overall content organization, default LTR, left to right, can be RTL for languages which read right to left
								startingPage:       0,                               // index of the first page to be displayed
								easing:             'easeInOutQuad',                 // easing method for complete transition
								easeIn:             'easeInQuad',                    // easing method for first half of transition
								easeOut:            'easeOutQuad',                   // easing method for second half of transition

								closed:             true,                           // start with the book "closed", will add empty pages to beginning and end of book
								closedFrontTitle:   null,                            // used with "closed", "menu" and "pageSelector", determines title of blank starting page
								closedFrontChapter: null,                            // used with "closed", "menu" and "chapterSelector", determines chapter name of blank starting page
								closedBackTitle:    null,                            // used with "closed", "menu" and "pageSelector", determines chapter name of blank ending page
								closedBackChapter:  null,                            // used with "closed", "menu" and "chapterSelector", determines chapter name of blank ending page
								covers:             false,                           // used with  "closed", makes first and last pages into covers, without page numbers (if enabled)

								pagePadding:        10,                              // padding for each page wrapper
								pageNumbers:        true,                            // display page numbers on each page

								hovers:             false,                            // enables preview pageturn hover animation, shows a small preview of previous or next page on hover
								overlays:           false,                            // enables navigation using a page sized overlay, when enabled links inside the content will not be clickable
								tabs:               false,                           // adds tabs along the top of the pages
								tabWidth:           60,                              // set the width of the tabs
								tabHeight:          20,                              // set the height of the tabs
								arrows:             false,                           // adds arrows overlayed over the book edges
								cursor:             'pointer',                       // cursor css setting for side bar areas

								hash:               false,                           // enables navigation using a hash string, ex: #/page/1 for page 1, will affect all booklets with 'hash' enabled
								keyboard:           true,                            // enables navigation with arrow keys (left: previous, right: next)
								next:               $bttn_next,          			// selector for element to use as click trigger for next page
								prev:               $bttn_prev,          			// selector for element to use as click trigger for previous page

								menu:               null,                            // selector for element to use as the menu area, required for 'pageSelector'
								pageSelector:       false,                           // enables navigation with a dropdown menu of pages, requires 'menu'
								chapterSelector:    false,                           // enables navigation with a dropdown menu of chapters, determined by the "rel" attribute, requires 'menu'

								shadows:            true,                            // display shadows on page animations
								shadowTopFwdWidth:  166,                             // shadow width for top forward anim
								shadowTopBackWidth: 166,                             // shadow width for top back anim
								shadowBtmWidth:     50,                              // shadow width for bottom shadow

								before:             function(){},                    // callback invoked before each page turn animation
								after:              function(){}                     // callback invoked after each page turn animation
							});
							Cufon.refresh();
						}
					}).attr('src',source);
				});
				
			});
			
			
			$(document).ready(function(){
				$(".thumb").click(function(){
					var empid="<?php echo $this->uri->segment(3);?>";
					var empcd="<?php echo $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code;?>";
					var id=$(this).attr("id");
					 $.get("<?php echo base_url();?>user/getservicebookbyid/"+id+"/"+empid, function(data){
                   $(".modal-content").html("<img style='width:100%' src='<?php echo base_url();?>uploads/"+empcd+"/service_book/"+data+"'>");
    });
					
					
				});
			});
        </script>
   </div>



</div></div></div>