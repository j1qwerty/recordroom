<style>

    .labeltext
    {
        font-weight:bold 
    }

    .error
    {
        color:red;
        font-weight:bold;
    }

    .imageThumb 
    {
        width: 177px;
        height: auto;
        float: left !important;
        border: 2px solid #eeeeee;
        margin-top: 6px;
    }

    .thumbs span 
    {
        font-weight: bold;
        margin-top: 3px;
    }

    .thumbs
    {
        width: 190px;
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

    a.thumbnail.fancybox img
    {
        height: 100%;
        width: 100%;
    }

    a.thumbnail{

        margin-bottom: 5px !important;

    }

    .imgset a.remove-buton {
        text-align: center;
        margin: 0 auto;
        float: left;
        width: 100%;
    }
    p.updatedon {
        font-size: 10px;
    }

    .carousel-inner > .item > img {
        margin: 0 auto;
    }

    img.imghere {
        object-fit: cover;
        height: 400px !important;
        overflow: hidden;
    }
    .carousel-control.left, .carousel-control.right {
        background:none;
    }
    #myCarousel {
        width: 70%;
        margin: 0 auto;
    }

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

    .book_wrapper {
        height: 590px !important;
    }
</style>

<div class="right_col">
    <div class=""><div class="page-title"><div class="title_left">
                <h3>View Map</h3>
            </div>
            <div style="float:right;">
                <?php if (count($lr) >= 1) { ?>
                    <a href="<?php echo base_url(); ?>user/generate_pdf/<?php echo 'MAP_' . $this->uri->segment(3); ?>" class="btn btn-info">Save as PDF</a>
                <?php } ?>
                <a class="btn btn-primary" href="javascript:void(0);" onClick="history.back();">Back</a></div>
        </div>
        <div class="clearfix"></div>
        <?php
        if ($this->session->flashdata('item') != '') {
            $message = $this->session->flashdata('item');
            ?>
            <div class="alert alert-<?php echo $message['class'] ?>"><?php echo $message['message'];
            ?> </div>
                <?php }
            ?>
        <div class="row">
            <div class="col-md-12 col-sm-12 col-xs-12">
                <div class="x_panel">
                    <div class="x_title">
                        <h2>View Map For <span class="nameheading"><?php echo $this->User_model->getval("file_tbl", "file_barcode", $this->uri->segment(3), 'file_name') . ' - ' . $this->uri->segment(3); ?></span></h2>
                        <ul class="nav navbar-right panel_toolbox">
                            <li><h4 class="text-right">No. of maps - <?php echo count($lr); ?></h4>

                            </li>                      
                        </ul>

                        <div class="clearfix"></div>
                    </div>

                    <div class="x-content">
                        <div class="col-md-12 col-sm-12 col-xs-12">
                            <div class='list-group gallery' style="width:100%">
                                <?php if (count($lr) >= 1) { ?>

                                    <div id="myCarousel" class="carousel slide" data-ride="carousel">
                                        <!-- Indicators -->
                                        <!--    <ol class="carousel-indicators">
                                        <?php // $k=0; foreach($lr as $value) {  ?>
                                              <li data-target="#myCarousel" data-slide-to="<?php // echo $k;  ?>" <?php // if($k==0) {  ?> class="active" <?php // }  ?>></li>
                                             
                                            <?php // $k++; }  ?>
                                            </ol>-->

                                        <!-- Wrapper for slides -->
                                        <div class="carousel-inner">
                                            <?php $j = 1;
                                            foreach ($lr as $value) { ?>
                                                <div class="item <?php if ($j == 1) {
                                                    echo 'active';
                                                } ?>">
                                                  <!-- <img src="la.jpg" alt="Los Angeles" style="width:100%;"> -->
                                                    <img class="imghere thumb" data-toggle="modal" id="<?php echo $value->map_id ?>" data-target="#myModal" src="<?php echo base_url(); ?>uploads/<?php echo $this->uri->segment(3);?>/map/<?php echo $value->filename; ?>" alt=""/>
                                                    <div class="carousel-caption">
                                                        <h3>Map No: <?php echo $value->pageno ?></h3>
                                                        <!--<p>LA is always so much fun!</p> -->
                                                        <p>Last Updated on :<br> <?php echo date('d-m-Y H:i:s', strtotime($value->uploaded_at)); ?></p>
                                                    </div>
                                                </div>
                                                    <?php $j++;
                                                } ?>
                                        </div>

                                        <!-- Left and right controls -->
                                        <a class="left carousel-control" href="#myCarousel" data-slide="prev">
                                            <span class="glyphicon glyphicon-chevron-left" style="color: red;"></span>
                                            <span class="sr-only">Previous</span>
                                        </a>
                                        <a class="right carousel-control" href="#myCarousel" data-slide="next">
                                            <span class="glyphicon glyphicon-chevron-right" style="color: red;"></span>
                                            <span class="sr-only">Next</span>
                                        </a>
                                    </div>
                                    <!-- <div class='col-sm-4 col-xs-6 col-md-3 col-lg-3'  style="width:150px;">
                                    <div class="imgset">
                                    <a class="thumbnail fancybox" rel="ligthbox"  style="height:auto !important"  href="<?php echo base_url(); ?>uploads/<?php echo $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code; ?>/leave_report/<?php echo $value->filename; ?>">
                                    <p><?php echo "Page no" . $value->pageno; ?></p>                  
                                    <img src="<?php echo base_url(); ?>uploads/<?php echo $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code; ?>/leave_report/<?php echo $value->filename; ?>" title="<?php echo "page no" . $value->pageno; ?>">
                                    <p class="updatedon">Last Updated on :<br> <?php echo date('d-m-Y H:i:s', strtotime($value->uploaded_at)); ?></p>
                                    </a>
                                    </div></div> -->
                                <?php
                                } else {
                                    ?><div class="container">
                                        <div class="col-md-8" style="color: red; margin-top: 100px; text-align: center;">
                                            Map is not uploaded!
                                        </div>
                                    </div><?php }
                                ?></div>
                        </div>
                    </div>
                    <!------------------------------ Modal -------------------->
                    <div class="modal fade" id="myModal" role="dialog">
                        <div class="modal-dialog" >
                            <!--Modal content-->
                            <div class="modal-content">
                                <div class="modal-header">
                                    <button type="button" class="close" data-dismiss="modal" style="position: relative; right: 10px; color: #000000;">&times;</button>
                                </div>
                                <div class="modal-body"></div>
                            </div>  
                        </div>
                    </div> 
                                        
                    <script src="<?php echo base_url(); ?>booklet/jquery.easing.1.3.js" type="text/javascript"></script>
                    <script src="<?php echo base_url(); ?>booklet/jquery.booklet.1.1.0.min.js" type="text/javascript"></script>

                    <link href="<?php echo base_url(); ?>booklet/jquery.booklet.1.1.0.css" type="text/css" rel="stylesheet" media="screen" />
                    <link rel="stylesheet" href="<?php echo base_url(); ?>css/style.css" type="text/css" media="screen"/>

                    <script src="<?php echo base_url(); ?>cufon/cufon-yui.js" type="text/javascript"></script>
                    <script src="<?php echo base_url(); ?>cufon/ChunkFive_400.font.js" type="text/javascript"></script>
                    <script src="<?php echo base_url(); ?>cufon/Note_this_400.font.js" type="text/javascript"></script>
                    <script type="text/javascript">
                      Cufon.replace('h1,p,.b-counter');
                      Cufon.replace('.book_wrapper a', {hover: true});
                      Cufon.replace('.title', {textShadow: '1px 1px #C59471'});
                      Cufon.replace('.reference a', {textShadow: '1px 1px #C59471'});
                      Cufon.replace('.loading', {textShadow: '1px 1px #000'});
                    </script>
                    <div class="modal fade" id="bookModal" role="dialog">
                        <div class="modal-dialog" style="width:70%">
                            <!-- Modal content-->
                            <div class="modal-content">
                                <button type="button" class="close" data-dismiss="modal">&times;</button>
                                <div class="book_wrapper">
                                    <a id="next_page_button"></a>
                                    <a id="prev_page_button"></a>
                                    <div id="loading" class="loading">Loading pages...</div>
                                    <div id="mybook" style="display:none;">
                                        <div class="b-load">
                                            <?php foreach ($lr as $sb) {    ?>
                                                <div class="mybooksource">
                                                    <div class="manage-height">
                                                        <img data-toggle="modal" class="thumb" id="<?php echo $sb->lr_id ?>" data-target="#myModal" src="<?php echo base_url(); ?>uploads/<?php echo $this->uri->segment(3); ?>/map/<?php echo $sb->filename ?>" alt=""/>
                                                    </div>
                                                    <p class="updatedon">Last Updated on : <?php echo date('d-m-Y H:i:s', strtotime($sb->uploaded_at)); ?></p>

                                                </div>
                                            <?php } ?>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div> 
                    <div class="col-md-12 col-sm-12 col-xs-12">
                    <?php if ($this->session->userdata("user_type") == 'Verifier') {
                            if (count($lr) >= 1) { ?>
                                <form class="falanae" action="<?php echo base_url(); ?>user/approve_reject" method="post">
                                    <div class="form-group">
                                        <div class="col-md-12">
                                            <input name="id" type="hidden" value="<?php echo $this->User_model->get_verification_id($this->uri->segment(3), 'LR'); ?>">
                                            <input name="emp_id" type="hidden" value="<?php echo $this->uri->segment(3); ?>">
                                            <input name="doc_type" type="hidden" value="LR">
                                            <input type="submit" name="submit" value="Approve" class="btn btn-success">
                                            <a class="btn btn-danger" data-toggle="modal" data-target="#remarkModal<?php echo $this->uri->segment(3); ?>">Reject</a>
                                            <div class="modal fade" id="remarkModal<?php echo $this->uri->segment(3); ?>" role="dialog">
                                                <div class="modal-dialog">
                                                    <!-- Modal content-->
                                                    <div class="modal-content">
                                                        <div class="modal-header">
                                                            <button type="button" class="close" data-dismiss="modal" style="position: relative; right: 10px; color: #000000;">&times;</button>
                                                            <h4 class="modal-title" style="margin:0; font-weight: 600;">Add Remark</h4>
                                                        </div>
                                                        <div class="modal-body" id="remarkModal<?php echo $this->uri->segment(3); ?>">
                                                            <div class="row">
                                                                <div class="item form-group" style="width:100%">
                                                                    <textarea id="remark" name="remark" placeholder="Enter Remark" class="form-control"></textarea>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="modal-footer" style="text-align: center;">
                                                            <input type="submit" name="submit" class="btn btn-primary" value="Reject">
                                                            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <!-- modal end -->
                                        </div>
                                    </div>
                                </form>
                            <?php } } ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<script>
    $(function () {
        var $mybook = $('#mybook');
        var $bttn_next = $('#next_page_button');
        var $bttn_prev = $('#prev_page_button');
        var $loading = $('#loading');
        var $mybook_images = $mybook.find('img');
        var cnt_images = $mybook_images.length;
        var loaded = 0;
        //preload all the images in the book,
        //and then call the booklet plugin

        $mybook_images.each(function () {
            var $img = $(this);
            var source = $img.attr('src');
            $('<img/>').load(function () {
                ++loaded;
                if (loaded == cnt_images) {
                    $loading.hide();
                    $bttn_next.show();
                    $bttn_prev.show();
                    $mybook.show().booklet({
                        name: null, // name of the booklet to display in the document title bar
                        width: 800, // container width
                        height: 500, // container height
                        speed: 600, // speed of the transition between pages
                        direction: 'LTR', // direction of the overall content organization, default LTR, left to right, can be RTL for languages which read right to left
                        startingPage: 0, // index of the first page to be displayed
                        easing: 'easeInOutQuad', // easing method for complete transition
                        easeIn: 'easeInQuad', // easing method for first half of transition
                        easeOut: 'easeOutQuad', // easing method for second half of transition

                        closed: true, // start with the book "closed", will add empty pages to beginning and end of book
                        closedFrontTitle: null, // used with "closed", "menu" and "pageSelector", determines title of blank starting page
                        closedFrontChapter: null, // used with "closed", "menu" and "chapterSelector", determines chapter name of blank starting page
                        closedBackTitle: null, // used with "closed", "menu" and "pageSelector", determines chapter name of blank ending page
                        closedBackChapter: null, // used with "closed", "menu" and "chapterSelector", determines chapter name of blank ending page
                        covers: false, // used with  "closed", makes first and last pages into covers, without page numbers (if enabled)

                        pagePadding: 10, // padding for each page wrapper
                        pageNumbers: true, // display page numbers on each page

                        hovers: false, // enables preview pageturn hover animation, shows a small preview of previous or next page on hover
                        overlays: false, // enables navigation using a page sized overlay, when enabled links inside the content will not be clickable
                        tabs: false, // adds tabs along the top of the pages
                        tabWidth: 60, // set the width of the tabs
                        tabHeight: 20, // set the height of the tabs
                        arrows: false, // adds arrows overlayed over the book edges
                        cursor: 'pointer', // cursor css setting for side bar areas

                        hash: false, // enables navigation using a hash string, ex: #/page/1 for page 1, will affect all booklets with 'hash' enabled
                        keyboard: true, // enables navigation with arrow keys (left: previous, right: next)
                        next: $bttn_next, // selector for element to use as click trigger for next page
                        prev: $bttn_prev, // selector for element to use as click trigger for previous page

                        menu: null, // selector for element to use as the menu area, required for 'pageSelector'
                        pageSelector: false, // enables navigation with a dropdown menu of pages, requires 'menu'
                        chapterSelector: false, // enables navigation with a dropdown menu of chapters, determined by the "rel" attribute, requires 'menu'

                        shadows: true, // display shadows on page animations
                        shadowTopFwdWidth: 166, // shadow width for top forward anim
                        shadowTopBackWidth: 166, // shadow width for top back anim
                        shadowBtmWidth: 50, // shadow width for bottom shadow

                        before: function () {}, // callback invoked before each page turn animation
                        after: function () {}                     // callback invoked after each page turn animation
                    });
                    Cufon.refresh();
                }
            }).attr('src', source);
        });

    });

    $(document).ready(function () {
    
        $(".thumb").click(function () {
            $("#myModal").find(".modal-body").html("<img class='center' src='<?php echo base_url(); ?>images/ajax-loader.gif'>");
            setTimeout(function () {
            }, 3000);
            var empid = "<?php echo $this->uri->segment(3); ?>";
            var empcd = "<?php echo $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code; ?>";
            var id = $(this).attr("id");
            $.get("<?php echo base_url(); ?>user/getmapbyid/" + id + "/" + empid, function (data) {
                console.log(data);
                $("#myModal").find(".modal-body").html("<img style='width:100%' src='<?php echo base_url(); ?>uploads/" + empcd + "/map/" + data + "'>");
            });
        });

        $('#myCarousel').carousel({
            wrap: false
        });
    });
</script>