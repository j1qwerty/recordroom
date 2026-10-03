<script src="<?php echo base_url(); ?>js/dataTables.min.js"></script>
<script src="<?php echo base_url(); ?>js/dataTables.min.js"></script>
<script src="<?php echo base_url(); ?>js/dataTables.bootstrap.min.js"></script>
<link rel="stylesheet" href="<?php echo base_url(); ?>css/dataTables.bootstrap.min.css">
<link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
<script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>
<script>
    $(function () {
        $("#startdate").datepicker({
            numberOfMonths: 1,
            dateFormat: 'yy-mm-dd',
            onSelect: function (selected) {
                var dt = new Date(selected);
                dt.setDate(dt.getDate() + 1);
                $("#enddate").datepicker("option", "minDate", dt);
            }
        });
        $("#enddate").datepicker({
            numberOfMonths: 1,
            dateFormat: 'yy-mm-dd',
            onSelect: function (selected) {
                var dt = new Date(selected);
                dt.setDate(dt.getDate() - 1);
                $("#startdate").datepicker("option", "maxDate", dt);
            }
        });
    });
</script>
<style>
    .error{
        color:red;
        font-weight:bold;

    }
    .item  p{
        margin:0px;
        color:red;
    }

    .btn-sm {
        padding: 5px 5px;
        font-size: 11px;
    }

    .buttons-flash {
        color: #fff;
        background-color: #398439;
    }

    .buttons-flash:hover {
        color: #fff;
    }

    .nopadding{
        padding:0px;
    }

    .nomargin{
        margin:0px;
    }

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

</style>
<?php
//echo '<pre>';
//print_r($Report);
//exit;
?>
<div class="right_col">
    <div class="page-title">
        <div class="title_left">
            <h3>Employee SR/LR/APAR No Update Report</h3>
        </div>
    </div>
    <div class="row">
        <div class="col-md-12 col-sm-12 col-xs-12">
            <div class="x_panel" style="min-height:500px;">
                <div class="col-md-12">&nbsp;</div>
                <div class="x_content">
                    <ul class="nav nav-tabs">
                        <li <?php if ($tabname == 'sr' || $tabname == '') { ?>class="active"<?php } ?>><a data-toggle="tab" href="#sr">Service Record</a></li>
                        <li <?php if ($tabname == 'lr') { ?>class="active"<?php } ?>><a data-toggle="tab" href="#lr">Leave Record</a></li>
                        <li <?php if ($tabname == 'apar') { ?>class="active"<?php } ?>><a data-toggle="tab" href="#apar">APAR</a></li>
                    </ul>

                    <div class="tab-content">
                        <div id="sr" class="tab-pane fade <?php if ($tabname == 'sr') {
                            echo 'in active';
                        } else {
                            echo '';
                        } ?>">
                            <div class="col-md-12">&nbsp;</div>
                            <h3>Service Record for employee not updated</h3>
                            <div class="col-md-12">&nbsp;</div>
                            <form name="myformsr" id="myformsr" action="<?php echo base_url(); ?>user/no_update_report" method="post">
                                <div class="col-md-4 nopadding">
                                    <label>Select Year</label>
                                    <div class="col-md-12 nopadding">
                                        <select name="sryear" id="sryear" class="form-control">
                                            <option value="">--Select Year--</option>
                                            <?php for ($i = 2018; $i <= date('Y'); $i++) { ?>
                                                <option value="<?php echo $i; ?>" <?php if ($Year == $i) {
                                                echo 'selected="selected"';
                                            } else {
                                                echo '';
                                            } ?>><?php echo $i; ?></option>
                                            <?php } ?>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label>Department</label>
                                    <div class="col-md-12 nopadding">
                                        <select name="department" id="department" class="form-control">
                                            <option value="all" <?php if ($selecteddep == 'all') {
                                                echo 'selected=selected';
                                            } else {
                                                echo '';
                                            } ?>>All Department</option>
                                            <?php foreach ($departmentlist as $dep) { ?>
                                                <option value="<?php echo $dep->id ?>" <?php if ($selecteddep == $dep->id) {
                                                echo 'selected=selected';
                                            } else {
                                                echo '';
                                            } ?>><?php echo $dep->name; ?></option>
                                            <?php } ?>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-4 nopadding">
                                    <input type="hidden" name="datatype" id="datatype" value="sr" />
                                    &nbsp;<input type="submit" name="searchsr" class="btn btn-success" style="margin-top:7%;" id="searchsr" value="Search" />
                                </div>
                            </form>
                            <div class="col-md-12">&nbsp;</div>
                            <?php if (!empty($ReportSr) && $ReportSr != 'No Data') { ?>
                                <div class="col-md-12">&nbsp;</div>
                                <div class="col-md-12">
                                <?php
                                if (isset($selecteddep)) {
                                    $seldepart = $selecteddep;
                                } else {
                                    $seldepart = 'all';
                                }
                                if (!empty($Year) && $Year != '') {
                                    $year = $Year;
                                } else {
                                    $year = date('Y');
                                }
                                ?>
                                    <a href="<?php echo base_url(); ?>user/noupdatereportexcel/<?php echo $year; ?>/<?php echo $seldepart; ?>/<?php echo $tabname; ?>">Excel Report</a>
                                </div>
                                <div class="col-md-12">&nbsp;</div>
                                <table id="example" class="table table-striped table-bordered" style="width:100%">
                                    <thead>
                                        <tr>
                                            <th>Employee ID</th>
                                            <th>Pf. No.</th>
                                            <th>Employee Name / DOB</th>
                                            <th>Department</th>
                                            <th>Designation</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    <?php
                                    $i = 1;
                                    foreach ($ReportSr as $reportEmployee) {
                                    	$fathername = '';
										$dob = 'NOT AVAILABLE';
										$fathername = $reportEmployee->fathername;
										if($fathername){
											$fathername = ' S/O '.$fathername;  
														}
										if(!empty($reportEmployee->dob)) {
											$dob = date('d M Y',strtotime($reportEmployee->dob));
										}
                                        $empdate = $this->User_model->getUserDetailByID($reportEmployee->emp_id);

                                        $department = $this->User_model->getDepartmentNamebyID($empdate[0]->emp_department);
                                        $designation = $this->User_model->getDesignationNamebyID($empdate[0]->emp_designation);

                                        $empname = $empdate[0]->employee_name;
                                        if (isset($department)) {
                                            $department_name = $department[0]->name;
                                            $designation_name = $designation[0]->name;
                                        } else {
                                            $department_name = '';
                                            $designation_name = '';
                                        }
                                        ?>
                                            <tr>
                                                <td><?php echo $reportEmployee->emp_id; ?></td>
                                                <!--by Preeti - 29-07-2019-->
                                                <td><a href="<?php echo base_url() . 'user/search_employee/' . $reportEmployee->employee_code; ?>" title="View Detail"><?php echo $reportEmployee->employee_code; ?></a></td>
												<td><?php echo $empname.$fathername ?> / <?php echo $dob; ?></td>
                                                <td><?php echo $department_name; ?></td>
                                                <td><?php echo $designation_name; ?></td>
                                            </tr>
                                        <?php $i++;
                                    } ?>
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th>Employee ID</th>
                                            <th>Pf. No.</th>
                                            <th>Employee Name / DOB</th>
                                            <th>Department</th>
                                            <th>Designation</th>
                                        </tr>
                                    </tfoot>
                                </table>					
                                <div class="col-md-6">
									<div class="pagination"><?php echo $links; ?></div>
								</div>
								<div class="col-md-6">
									<span class="pull-right" style="margin-top: 25px;">Showing <?= count($ReportSr) ?> of <?= $total_rows ?> records</span>
								</div>
                                <?php } else { ?>
                                <p>No record found.</p>
                                <?php } ?>
                        </div>
                        <div id="lr" class="tab-pane fade <?php if ($tabname == 'lr') {
                            echo 'in active';
                        } else {
                            echo '';
                        } ?>">
                            <div class="col-md-12">&nbsp;</div>
                            <h3>Leave Record for employee not updated</h3>
                            <div class="col-md-12">&nbsp;</div>
                            <form name="myformlr" id="myformlr" action="<?php echo base_url(); ?>user/no_update_report" method="post">							
                                <div class="col-md-6 nopadding">
                                    <label>Duration</label>
                                    <div class="col-md-12 nopadding">
                                        <div class="col-md-6 nopadding">
                                            <input type="text" name="startdate" id="startdate" placeholder="Start Date" value="<?php echo date("Y-m-d", strtotime("-6 months")); ?>" class="form-control" />
                                        </div>
                                        <div class="col-md-6">
                                            <input type="text" name="enddate" id="enddate" placeholder="End Date" value="<?php echo date("Y-m-d"); ?>" class="form-control" />
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label>Department</label>
                                    <div class="col-md-12 nopadding">
                                        <select name="department" id="department" class="form-control">
                                            <option value="all" <?php if ($selecteddep == 'all') {
                                echo 'selected=selected';
                            } else {
                                echo '';
                            } ?>>All Department</option>
                                <?php foreach ($departmentlist as $dep) { ?>
                                                <option value="<?php echo $dep->id ?>" <?php if ($selecteddep == $dep->id) {
                                        echo 'selected=selected';
                                    } else {
                                        echo '';
                                    } ?>><?php echo $dep->name; ?></option>
                                <?php } ?>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-2 nopadding">
                                    <input type="hidden" name="datatype" id="datatype" value="lr" />
                                    <input type="submit" name="searchlr" class="btn btn-success" style="margin-top:14%;" id="searchlr" value="Search" />
                                </div>
                            </form>
                            <div class="col-md-12">&nbsp;</div>
                                    <?php if (!empty($ReportLr) && $ReportLr != 'No Data') { ?>

                                <div class="col-md-12">&nbsp;</div>
                                <div class="col-md-12">
                                        <?php
                                        if (isset($selecteddep)) {
                                            $seldepart = $selecteddep;
                                        } else {
                                            $seldepart = 'all';
                                        }
                                        //echo $Year.'ARUN';
                                        if (!empty($startdate) && $startdate != '') {
                                            $startdate = $startdate;
                                        } else {
                                            $startdate = date('Y') . '-01-01 00:00:00';
                                        }
                                        if (!empty($enddate) && $enddate != '') {
                                            $enddate = $enddate;
                                        } else {
                                            $enddate = date('Y') . '-12-31 00:00:00';
                                        }
                                        ?>
                                    <a href="<?php echo base_url(); ?>user/noupdatereportexcelsecond/<?php echo $startdate; ?>/<?php echo $enddate; ?>/<?php echo $seldepart; ?>/<?php echo 'lr'; ?>">Excel Report</a>
                                </div>
                                <div class="col-md-12">&nbsp;</div>

                                <table id="example" class="table table-striped table-bordered" style="width:100%">
                                    <thead>
                                        <tr>
                                            <th>Employee ID</th>
                                            <th>Pf. No.</th>
                                            <th>Employee Name / DOB</th>
                                            <th>Department</th>
                                            <th>Designation</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    <?php
                                    $i = 1;
                                    foreach ($ReportLr as $reportEmployee) {
                                    	$fathername = '';
					                	$dob = 'NOT AVAILABLE';
					                	$fathername = $reportEmployee->fathername;
					                	if($fathername){
					                		$fathername = ' S/O '.$fathername;  
														}
	                                	if(!empty($reportEmployee->dob)) {
											$dob = date('d M Y',strtotime($reportEmployee->dob));
										}

                                        $empdate = $this->User_model->getUserDetailByID($reportEmployee->emp_id);

                                        $department = $this->User_model->getDepartmentNamebyID($empdate[0]->emp_department);
                                        $designation = $this->User_model->getDesignationNamebyID($empdate[0]->emp_designation);

                                        $empname = $empdate[0]->employee_name;
                                        if (isset($department)) {
                                            $department_name = $department[0]->name;
                                            $designation_name = $designation[0]->name;
                                        } else {
                                            $department_name = '';
                                            $designation_name = '';
                                        }
                                        ?>
                                            <tr>
                                                <td><?php echo $reportEmployee->emp_id; ?></td>
                                                <!--by Preeti - 29-07-2019-->
                                                <td><a href="<?php echo base_url() . 'user/search_employee/' . $reportEmployee->employee_code; ?>" title="View Detail"><?php echo $reportEmployee->employee_code; ?></a></td>
                                                <td><?php echo $empname.$fathername ?> / <?php echo $dob; ?></td>
                                                <td><?php echo $department_name; ?></td>
                                                <td><?php echo $designation_name; ?></td>
                                            </tr>
                                                    <?php $i++;
                                                } ?>
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th>Employee ID</th>
                                            <th>Pf. No.</th>
                                            <th>Employee Name / DOB</th>
                                            <th>Department</th>
                                            <th>Designation</th>
                                        </tr>
                                    </tfoot>
                                </table>					
                               	<div class="col-md-6">
									<div class="pagination"><?php echo $links; ?></div>
								</div>
								<div class="col-md-6">
									<span class="pull-right" style="margin-top: 25px;">Showing <?= count($ReportLr) ?> of <?= $total_rows ?> records</span>
								</div>
                                <?php } else { ?>
                                <p>No record found.</p>
                                <?php } ?>
                        </div>
                        <div id="apar" class="tab-pane fade <?php if ($tabname == 'apar') {
                                    echo 'in active';
                                } else {
                                    echo '';
                                } ?>">
                            <div class="col-md-12">&nbsp;</div>
                            <h3>APAR for employee not updated</h3>
                            <div class="col-md-12">&nbsp;</div>
                            <form name="myformapar" id="myformapar" action="<?php echo base_url(); ?>user/no_update_report" method="post">
                                <div class="col-md-4 nopadding">
                                    <label>Select Year</label>
                                    <div class="col-md-12 nopadding">
                                        <select name="aparyear" id="aparyear" class="form-control">
                                            <option value="">--Select Year--</option>
                                            <?php for ($i = 2014; $i <= date('Y'); $i++) { ?>
                                                <option value="<?php echo $i; ?>" <?php if ($Year == $i) {
                                                echo 'selected="selected"';
                                            } else {
                                                echo '';
                                            } ?>><?php echo $i; ?></option>
                                    <?php } ?>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label>Department</label>
                                    <div class="col-md-12 nopadding">
                                        <select name="department" id="department" class="form-control">
                                            <option value="all" <?php if ($selecteddep == 'all') {
                                        echo 'selected=selected';
                                    } else {
                                        echo '';
                                    } ?>>All Department</option>
                                    <?php foreach ($departmentlist as $dep) { ?>
                                                <option value="<?php echo $dep->id ?>" <?php if ($selecteddep == $dep->id) {
                                        echo 'selected=selected';
                                    } else {
                                        echo '';
                                    } ?>><?php echo $dep->name; ?></option>
                                    <?php } ?>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-4 nopadding">
                                    <input type="hidden" name="datatype" id="datatype" value="apar" />
                                    &nbsp;<input type="submit" name="searchapar" class="btn btn-success" style="margin-top:7%;" id="searchapar" value="Search" />
                                </div>
                            </form>
                            <div class="col-md-12">&nbsp;</div>
                            <?php if (!empty($ReportApar) && $ReportApar != 'No Data') { ?>

                                <div class="col-md-12">&nbsp;</div>
                                <div class="col-md-12">
                                <?php
                                if (isset($selecteddep)) {
                                    $seldepart = $selecteddep;
                                } else {
                                    $seldepart = 'all';
                                }
                                //echo $Year.'ARUN';
                                if (!empty($Year) && $Year != '') {
                                    $year = $Year;
                                } else {
                                    $year = date('Y');
                                }
                                ?>
                                    <a href="<?php echo base_url(); ?>user/noupdatereportexcel/<?php echo $year; ?>/<?php echo $seldepart; ?>/<?php echo $tabname; ?>">Excel Report</a>
                                </div>
                                <div class="col-md-12">&nbsp;</div>						

                                <table id="example" class="table table-striped table-bordered" style="width:100%">
                                    <thead>
                                        <tr>
                                            <th>Employee ID</th>
                                            <th>Pf. No.</th>
                                            <th>Employee Name / DOB</th>
                                            <th>Department</th>
                                            <th>Designation</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    <?php
                                    $i = 1;
                                    foreach ($ReportApar as $reportEmployee) {

                                    	$fathername = '';
					                	$dob = 'NOT AVAILABLE';
					                	$fathername = $reportEmployee->fathername;
					                	if($fathername){
					                		$fathername = ' S/O '.$fathername;  
														}
	                                	if(!empty($reportEmployee->dob)) {
											$dob = date('d M Y',strtotime($reportEmployee->dob));
										}

                                        $empdate = $this->User_model->getUserDetailByID($reportEmployee->emp_id);

                                        $department = $this->User_model->getDepartmentNamebyID($empdate[0]->emp_department);
                                        $designation = $this->User_model->getDesignationNamebyID($empdate[0]->emp_designation);

                                        $empname = $empdate[0]->employee_name;
                                        if (isset($department)) {
                                            $department_name = $department[0]->name;
                                            $designation_name = $designation[0]->name;
                                        } else {
                                            $department_name = '';
                                            $designation_name = '';
                                        }
                                        ?>
                                            <tr>
                                                <td><?php echo $reportEmployee->emp_id; ?></td>
                                                <!--by Preeti - 29-07-2019-->
                                                <td><a href="<?php echo base_url() . 'user/search_employee/' . $reportEmployee->employee_code; ?>" title="View Detail"><?php echo $reportEmployee->employee_code; ?></a></td>
                                                <td><?php echo $empname.$fathername ?> / <?php echo $dob; ?></td>
                                                <td><?php echo $department_name; ?></td>
                                                <td><?php echo $designation_name; ?></td>
                                            </tr>
                                        <?php $i++;
                                    } ?>
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th>Employee ID</th>
                                            <th>Pf. No.</th>
                                            <th>Employee Name / DOB</th>
                                            <th>Department</th>
                                            <th>Designation</th>
                                        </tr>
                                    </tfoot>
                                </table>					
                                <div class="col-md-6">
									<div class="pagination"><?php echo $links; ?></div>
								</div>
								<div class="col-md-6">
									<span class="pull-right" style="margin-top: 25px;">Showing <?= count($ReportApar) ?> of <?= $total_rows ?> records</span>
								</div>
                                <?php } else { ?>
                                <p>No record found.</p>
                                <?php } ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>