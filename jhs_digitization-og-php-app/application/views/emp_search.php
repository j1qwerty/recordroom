<style type="text/css">
  .inner {
    text-align: center;
  }

  .small-box {
    height:130px;
    display: table-cell;
    vertical-align: middle;
  }
  .small-box{border-radius:2px;position:relative;display:block;margin-bottom:20px;box-shadow:0 1px 1px rgba(0,0,0,0.1)}.small-box>.inner{padding:10px}.small-box>.small-box-footer{position:relative;text-align:center;padding:3px 0;color:#fff;color:rgba(255,255,255,0.8);display:block;z-index:10;background:rgba(0,0,0,0.1);text-decoration:none}.small-box>.small-box-footer:hover{color:#fff;background:rgba(0,0,0,0.15)}.small-box h3{font-size:38px;font-weight:bold;margin:0 0 10px 0;white-space:nowrap;padding:0}.small-box p{font-size:15px}.small-box p>small{display:block;color:#f9f9f9;font-size:13px;margin-top:5px}.small-box h3,.small-box p{z-index:5px}.small-box .icon{-webkit-transition:all .3s linear;-o-transition:all .3s linear;transition:all .3s linear;position:absolute;top:-10px;right:10px;z-index:0;font-size:90px;color:rgba(0,0,0,0.15)}.small-box:hover{text-decoration:none;color:#f9f9f9}.small-box:hover .icon{font-size:95px}@media (max-width:767px){.small-box{text-align:center}.small-box .icon{display:none}.small-box p{font-size:12px}}

  .not-active {
    pointer-events: none;
    cursor: default;
    text-decoration: none;
    color: black;
  }
  /*pagination*/
  .pagination > a, .pagination > strong{
      position: relative;
      float: left;
      padding: 6px 12px;
      margin-left: -1px;
      line-height: 1.42857143;
      color: #337ab7;
      text-decoration: none;
      background-color: #fff;
      border: 1px solid #ddd;
  }
  .pagination> a:focus, .pagination> a:hover, .pagination > strong:focus, .pagination > strong:hover {
      z-index: 2;
      color: #23527c;
      background-color: #eee;
      border-color: #ddd;
  }
  .pagination > strong {
      background: #337ab7;
      color: #fff;
      border: 1px solid #337ab7;
  }
  /*pagination*/
</style>
<?php // echo '<pre>';print_r($employee_list);exit;?>
<div class="right_col" role="main">
    <div class="">
   

        <div class="row">
            <div class="col-md-12 col-sm-12 col-xs-12">
                <div class="x_panel">
                    <div class="x_title">
                        <h4>Issue Property File</h4>
                        <div class="clearfix"></div>
                    </div>
                    <div id="msg">
                            <?php 
                            if ($this->session->flashdata("error") != '') {
                                echo '<div class="alert alert-danger"><strong>Error! </strong>' . $this->session->flashdata("error") . '</div>';
                            }
                            if ($this->session->flashdata("success")!='') {
                                echo '<div class="alert alert-success"><strong>Success! </strong>' . $this->session->flashdata("success") . '</div>';
                            }
                            ?>
                    </div>                    
                    <!--<form class="falanae" method="post" action="<?php //echo base_url();?>record/borrow_list"  method="post">-->
                    <!--<form>-->    
                        <div class="row">
                            <div class="col-md-3"></div>
                            <div class="col-md-5">
                                <select name="emp_id" class="select select2_single form-control" required="required" tabindex="-1" >
                                    <option value="0">Employee Name - Code</option>
                                    <?php
                                    foreach($employee_list as $list){ ?>
                                    <option value="<?php echo $list->emp_id; ?>"><?php echo $list->employee_name.' - '.$list->employee_code;?></option>
                                    <?php } ?>
                                </select>
                            </div>
<!--                            <div class="col-md-1">
                                <button name="submit" type="submit" class="btn btn-primary">Submit</button>
                            </div>-->
                            <div class="col-md-3"></div>
                        </div>
                    <!--</form>-->
                </div>
            </div>
        </div>
    </div>
</div>
<script type="text/javascript">
    $(document).ready(function(){
        $('select').on('change', function() {
        var emp_id = $(this).val(); // get selected value
          if (emp_id) { // require a URL
              window.location = "<?php echo base_url();?>record/borrow_list/"+emp_id; 
          }
          return false;
        });
    });
</script>
