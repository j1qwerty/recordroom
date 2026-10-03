<style>
  #room_list_length{
      display: none;
  }
  .item p {
    margin: 0px;
    color: red;
}
</style>
<div class="right_col" role="main">
    <div class="">
        <div class="page-title">
            <div class="title_left">
                <h3>Shelf</h3>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-12 col-sm-12 col-xs-12">
                <div class="x_panel">
                    <div class="x_title">
                        <?php if(isset($shelf_detail)){?>
                        <h4 style="float: left;">Edit</h4>
                        <a href="<?php echo base_url();?>store/shelf" class="btn btn-primary" style="margin-left: 900px;">Back</a>
                        <?php }else{?>
                        <h4>Add</h4>
                        <?php } ?>
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
                    <div class="row">
                        <?php if(isset($shelf_detail)){?>
                        <form method="POST" name="shelf_edit" action="<?php echo base_url();?>store/updateshelf">
                            <input  type="hidden" id="shelf_id" class="form-control"  value="<?php echo $shelf_detail->shelf_id; ?>" name="shelf_id">
                            <div class="form-body" style="padding: 10px;">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="item form-group">
                                        <label for="room_id">Room <span style="color:red">*</span></label>
                                        <select id="room_id_edit" name="room_id" class="form-control">
                                            <option value="">--Select Room--</option>
                                            <?php foreach($room_list as $room){?>
                                            <option value="<?php echo $room->room_id;?>" <?php if($room->room_id == $shelf_detail->room_id){echo 'selected';}?>><?php echo $room->room_name;?></option>   
                                            <?php }?>
                                        </select>
                                        <?php echo form_error('room_name'); ?>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="item form-group">
                                        <label for="section_id">Section <span style="color:red">*</span></label>
                                        <select id="section_id_edit" name="section_id" class="form-control">
                                            <?php foreach($section_list as $section){?>
                                            <option value="<?php echo $section->section_id;?>" <?php if($section->section_id == $shelf_detail->section_id){echo 'selected';}?>><?php echo $section->section_name;?></option>   
                                            <?php }?>
                                        </select>
                                        <?php echo form_error('section_name'); ?>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="item form-group">
                                        <label for="almirah_id">Almirah <span style="color:red">*</span></label>
                                        <select id="almirah_id_edit" name="almirah_id" class="form-control">
                                            <?php foreach($almirah_list as $almirah){?>
                                            <option value="<?php echo $almirah->almirah_id;?>" <?php if($almirah->almirah_id == $shelf_detail->almirah_id){echo 'selected';}?>><?php echo $almirah->almirah_name;?></option>   
                                            <?php }?>
                                        </select>
                                        <?php echo form_error('almirah_name'); ?>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="item form-group">
                                        <label for="shelf_name">Shelf Name <span style="color:red">*</span></label>
                                        <input  type="text" id="shelf_name" class="form-control"  value="<?php echo $shelf_detail->shelf_name;?>" name="shelf_name" placeholder="Enter shelf name" required="true" maxlength="20">
                                        <?php echo form_error('shelf_name'); ?>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="item form-group">
                                        <label for="shelf_barcode">Shelf Barcode <span style="color:red">*</span></label>
                                        <input  type="text" id="shelf_barcode" class="form-control"  value="<?php echo $shelf_detail->shelf_barcode;?>" name="shelf_barcode" placeholder="Enter shelf barcode" required="true" maxlength="20">
                                        <?php echo form_error('shelf_barcode'); ?>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div style="padding-left:17px;margin-top: 22px;">
                                        <button id="send" type="submit" class="btn btn-success" >Update</button>
                                        <button type="reset" class="btn btn-danger">Reset</button>
                                    </div>
                                </div>
                            </div>
                                </div>
                        </form>
                        <?php }else{?>
                        <form method="POST" name="shelf_frm" action="<?php echo base_url();?>store/addshelf">
                            <div class="form-body" style="padding: 10px;">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="item form-group">
                                            <label for="room_id">Room <span style="color:red">*</span></label>
                                            <select id="room_id" name="room_id" class="form-control">
                                                <option value="">--Select Room--</option>
                                                <?php foreach($room_list as $room){?>
                                                <option value="<?php echo $room->room_id;?>"><?php echo $room->room_name;?></option>   
                                                <?php }?>
                                            </select>
                                            <?php echo form_error('room_name'); ?>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="item form-group">
                                            <label for="section_id">Section <span style="color:red">*</span></label>
                                            <select id="section_id" name="section_id" class="form-control">

                                            </select>
                                            <?php echo form_error('section_name'); ?>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="item form-group">
                                            <label for="almirah_id">Almirah <span style="color:red">*</span></label>
                                            <select id="almirah_id" name="almirah_id" class="form-control">

                                            </select>
                                            <?php echo form_error('almirah_name'); ?>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="item form-group">
                                            <label for="shelf_name">Shelf Name <span style="color:red">*</span></label>
                                            <input  type="text" id="shelf_name" class="form-control"  value="<?php echo set_value('shelf_name'); ?>" name="shelf_name" placeholder="Enter shelf name" required="true" maxlength="20">
                                            <?php echo form_error('shelf_name'); ?>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="item form-group">
                                            <label for="shelf_barcode">Shelf Barcode <span style="color:red">*</span></label>
                                            <input  type="text" id="shelf_barcode" class="form-control"  value="<?php echo set_value('shelf_barcode'); ?>" name="shelf_barcode" placeholder="Enter shelf barcode" required="true" maxlength="20">
                                            <?php echo form_error('shelf_barcode'); ?>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div style="padding-left:17px;margin-top: 22px;">
                                            <button id="send" type="submit" class="btn btn-success" >Submit</button>
                                            <button type="reset" class="btn btn-danger">Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                        <?php } ?>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-12 col-sm-12 col-xs-12">
                <div class="x_panel">
                    <div class="x_title">
                        <h4>List</h4>
                        <div class="clearfix"></div>
                    </div>
                    
                    <?php if(!empty($shelf_list)){?>
                    <table id="shelf_list" class="table table-striped table-bordered" style="width:100%">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Room</th>
                                <th>Section</th>
                                <th>Almirah</th>
                                <th>Shelf</th>
                                <th>Barcode</th>
                                <th>Status</th>
                                <th>Action</th>
                              </tr>
                        </thead>
                    <tbody>
                        <?php $i=1;
                        if(!empty($shelf_list)) {
                            $i = 0;
                            foreach($shelf_list as $list) {
                            $ct = $this->Store_model->checkShelfFileAvail($list->shelf_barcode);?>
                            <tr id="r2"> 
                            <td><?php echo ++$i;?></td>
                            <td><?php echo $list->room_name;?></td>
                            <td><?php echo $list->section_name;?></td>
                            <td><?php echo $list->almirah_name;?></td>
                            <td><?php echo $list->shelf_name;?></td>
                            <td><?php echo $list->shelf_barcode;?></td>
                            <td><?php echo ($list->shelf_status == '1')?'Active':'Inactive';?></td>
                            <td><a href="<?php echo base_url();?>store/editshelf/<?php echo $list->shelf_id;?>" title="Edit"><i class="fa fa-pencil"></i></a>
                                <?php if($ct->total == '0'){ 
                                    if($list->shelf_status == '1'){echo ' | ';?>
                                <a href="<?php echo base_url();?>store/inactiveshelf/<?php echo $list->shelf_id;?>" title="Inactive">
                                    <i class="fa fa-thumbs-down" aria-hidden="true" style="color:red;"></i></a>
                                    <?php }else{  echo ' | ';?>
                                <a href="<?php echo base_url();?>store/activeshelf/<?php echo $list->shelf_id;?>" title="Active">
                                    <i class="fa fa-thumbs-up" aria-hidden="true" style="color:green;"></i></a>
                                <?php }}?></td>
                        </tr><?php } ?> 
                           <?php } ?>
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>#</th>
                            <th>Room</th>
                            <th>Section</th>
                            <th>Almirah</th>
                            <th>Shelf</th>
                            <th>Barcode</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </tfoot>
                    </table>
                    <?php }else{?>
                    <p>No record found.</p>
                    <?php }?>
                </div>
            </div>
        </div>
    </div>
</div>
<script type="text/javascript">
    $(document).ready(function(){
        $('#shelf_list').DataTable();
        $("#room_id").change(function(){
            var room_id = $(this).val();
            $.ajax({
                type: 'POST',
                url: '<?php echo base_url();?>store/sectionlist',
                data: {room_id:room_id},
                dataType: 'html',
                success: function (data) {
                    $('#section_id').html(data);
                },
            });
        });
        $("#room_id_edit").change(function(){
            var room_id = $(this).val();
            $.ajax({
                type: 'POST',
                url: '<?php echo base_url();?>store/sectionlist',
                data: {room_id:room_id},
                dataType: 'html',
                success: function (data) {
                    $('#section_id_edit').html(data);
                },
            });
        });
        $("#section_id").change(function(){
            var section_id = $(this).val();
            $.ajax({
                type: 'POST',
                url: '<?php echo base_url();?>store/almirahlist',
                data: {section_id:section_id},
                dataType: 'html',
                success: function (data) {
                    $('#almirah_id').html(data);
                },
            });
        });
        $("#section_id_edit").change(function(){
            var section_id = $(this).val();
            $.ajax({
                type: 'POST',
                url: '<?php echo base_url();?>store/almirahlist',
                data: {section_id:section_id},
                dataType: 'html',
                success: function (data) {
                    $('#almirah_id_edit').html(data);
                },
            });
        });
    });
</script>

