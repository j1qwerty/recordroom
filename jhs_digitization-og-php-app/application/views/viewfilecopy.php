<style>
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
    <div class=""><div class="page-title">
            <div class="title_left">
            <h3>View File Copy</h3>
            </div>
            <div style="float:right;">
                <!--<a class="btn btn-primary" data-toggle="modal" data-target="#bookModal">Book View</a>-->
                <?php // if (count($this->User_model->getallFileCopy($this->uri->segment(3))) >= 1) { ?>
                    <!--<a href="<?php // echo base_url(); ?>user/generate_pdf/<?php // echo 'FILE_' . $this->uri->segment(3); ?>" class="btn btn-info">Save as PDF</a>-->
                <?php // } ?>
                <a class="btn btn-primary" href="javascript:void(0);" onClick="history.back();">Back</a></div>
        </div>
        <div class="clearfix"></div>
        <?php
        if ($this->session->flashdata('item') != '') {
            $message = $this->session->flashdata('item');
            ?>
            <div class="alert alert-<?php echo $message['class'] ?>"><?php echo $message['message']; ?> </div>
            <?php
        }
        ?>
        <div class="row">
            <div class="col-md-12 col-sm-12 col-xs-12">
                <div class="x_panel">
                    <div class="x_title">
                        <h2>View File copy of <span class="nameheading"><?php echo $this->User_model->getval("file_tbl", "file_barcode", $this->uri->segment(3), 'file_name') . ' - ' .$this->uri->segment(3); ?></span></h2>
                        <ul class="nav navbar-right panel_toolbox">
                            <li><h4 class="text-right">No. of files - <?php echo count($this->User_model->getallFileCopy($this->uri->segment(3))); ?></h4>
                            </li>                      
                        </ul>
                        <div class="clearfix"></div>
                    </div>
                    <div class="x-content">
                        <div class="col-md-12 col-sm-12 col-xs-12">
                            <div class='list-group gallery' style="width:100%">
                                <?php
                                $sb = $this->User_model->getFiledetail($this->uri->segment(3));
                                foreach($sb as $value){?>
                                       <div class='col-sm-4 col-xs-6 col-md-3 col-lg-3' style="width:150px;">
                                            <div class="imgset">
                                                <a class="thumbnail fancybox" rel="ligthbox" style="height:auto !important" href="<?php echo base_url();?>uploads/<?php echo $this->uri->segment(3);?>/files/<?php echo $value->filename;?>" target="_blank">
                                                    <p><?php echo "File ".$value->pageno;?></p>                  
                                                    <!--<img class="imgherea" src="<?php // echo base_url();?>uploads/<?php //echo $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code;?>/files/<?php echo $value->filename;?>" title="<?php echo "File".$value->pageno;?>">-->
                                                    <img class="imgherea" src="<?php echo base_url();?>uploads/pdf-img.png" title="<?php echo "File".$value->pageno;?>">
                                                </a>
                                                <a href="<?php echo base_url();?>user/deletefile/<?php echo $value->file_id;?>/<?php echo $this->uri->segment(3);?>" class="remove-buton" onclick="return confirm('Are you sure want to delete?')">
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

<!--                    <script src="<?php echo base_url(); ?>booklet/jquery.easing.1.3.js" type="text/javascript"></script>
                    <script src="<?php echo base_url(); ?>booklet/jquery.booklet.1.1.0.min.js" type="text/javascript"></script>

                    <link href="<?php echo base_url(); ?>booklet/jquery.booklet.1.1.0.css" type="text/css" rel="stylesheet" media="screen" />
                    <link rel="stylesheet" href="<?php echo base_url(); ?>css/style.css" type="text/css" media="screen"/>-->

<!--                    <script src="<?php echo base_url(); ?>cufon/cufon-yui.js" type="text/javascript"></script>
                    <script src="<?php echo base_url(); ?>cufon/ChunkFive_400.font.js" type="text/javascript"></script>
                    <script src="<?php echo base_url(); ?>cufon/Note_this_400.font.js" type="text/javascript"></script>-->

                </div>
            </div>
        </div>
    </div>
</div>