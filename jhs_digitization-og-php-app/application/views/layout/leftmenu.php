<?php // echo '<pre>';print_r($_SESSION); exit; ?>
<div class="col-md-3 left_col">
    <div class="left_col scroll-view">
        <div class="navbar nav_title" style="border: 0;">
            <a href="<?php echo base_url() ?>user/dashboard" class="site_title">
                <!--<img src="<?php echo base_url(); ?>images/logo.png" alt="...">--> 
                <span style="font-size: 16px;">Jhansi Development Authority</span></a>
        </div>
        <div class="clearfix"></div>
        <div class="profile clearfix">
            <div class="profile_pic">
                <a href="<?php echo base_url() ?>user/dashboard"><img src="<?php echo base_url(); ?>images/img.jpg" alt="..." class="img-circle profile_img"></a>
            </div>
            <div class="profile_info">
                <h2><a href="#"><?php
                        if ($this->session->userdata("user_id") != 'admin') {
                            $empname = $this->User_model->getval("drm_employee", "employee_code", $this->session->userdata("user_id"), "employee_name");
                            if (isset($empname)) {
                                echo strtoupper($empname);
                            } else {
                                echo '';
                            }
                        } else {
                            echo "Admin";
                        }
                        ?>
                    </a>
                </h2>
                <h6 style="color: #FFF;"><?php if ($this->session->userdata("user_id") != 'admin') {
                            echo '(' . $this->session->userdata("user_type") . ')';
                        } ?></h6>
            </div>
        </div>
        <br />
        <div id="sidebar-menu" class="main_menu_side hidden-print main_menu">
            <div class="menu_section">               
                <ul class="nav side-menu">
                <?php if ($this->session->userdata("user_type") == 'Admin') { ?>
                        <li><a href="<?php echo base_url() ?>user/dashboard"><i class="fa fa-home"></i> Dashboard</a></li>
                    <?php } ?>
                    <?php if ($this->session->userdata("user_type") == 'Admin') {?>
                    <li><a><i class="fa fa-user"></i> Employee Management <span class="fa fa-chevron-down"></span></a>
                        <ul class="nav child_menu">
                            <li><a href="<?php echo base_url(); ?>user/employee">Add Employee</a></li>
                            <li><a href="<?php echo base_url() ?>user/search_employee"> Search Employee</a></li>
                        </ul>
                    </li>
                    <?php } ?>
                    <!--Preeti - 16-02-2021 - file menu-->
                    <li><a><i class="fa fa-book"></i> File Management <span class="fa fa-chevron-down"></span></a>
                        <ul class="nav child_menu">
                            <?php if ($this->session->userdata("user_type") != 'Emp_view') {
                                ?>					
                                <li><a href="<?php echo base_url(); ?>file/file">Add File</a></li>
                            <?php } ?>
                            <li><a href="<?php echo base_url();?>file/search_file"> Search File</a></li>
                        </ul>
                    </li>
                    <li><a><i class="fa fa-edit"></i> Issue/Return <span class="fa fa-chevron-down"></span></a>
                        <ul class="nav child_menu">
                            <?php if ($this->session->userdata("user_type") == 'Admin'){?>
                            <li><a href="<?php echo base_url(); ?>record">Issue/Return</a></li>
                            <?php } ?>
                            <li><a href="<?php echo base_url(); ?>record/issuefile">Issued File</a></li>
                            <li><a href="<?php echo base_url(); ?>record/returnfilelist">Returned File</a></li>
                        </ul>
                    </li>
                    <?php if ($this->session->userdata("user_type") == 'Admin'){?>
                    <li><a><i class="fa fa-bank"></i> Record Keeping<span class="fa fa-chevron-down"></span></a>
                        <ul class="nav child_menu">
                            <li><a href="<?php echo base_url(); ?>store/room">Room</a></li>
                            <li><a href="<?php echo base_url(); ?>store/section">Section</a></li>
                            <li><a href="<?php echo base_url(); ?>store/almirah">Almirah</a></li>
                            <li><a href="<?php echo base_url(); ?>store/shelf">Shelf</a></li>
                        </ul>
                    </li>
                    <?php } ?>
                </ul>
            </div>


        </div>
        <!-- /sidebar menu -->

    </div>
</div>

<!-- top navigation -->
<div class="top_nav">
    <div class="nav_menu">
        <nav>
            <div class="nav toggle">
                <a id="menu_toggle"><i class="fa fa-bars"></i></a>
            </div>
            <ul class="nav navbar-nav navbar-right">
                <li class="">
                    <a href="javascript:;" class="user-profile dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                        <img src="<?php echo base_url(); ?>images/img.jpg" alt=""><?php
                        if ($this->session->userdata("user_id") != 'admin') {
                            echo strtoupper($this->User_model->getval("drm_employee", "employee_code", $this->session->userdata("user_id"), "employee_name"));
                        } else {
                            echo "Admin";
                        }
                        ?>
                        <span class=" fa fa-angle-down"></span>
                    </a>
                    <ul class="dropdown-menu dropdown-usermenu pull-right">
                        <!---<li><a href="javascript:;"> Profile</a></li>
                        <li>
                          <a href="javascript:;">
                            <span class="badge bg-red pull-right">50%</span>
                            <span>Settings</span>
                          </a>
                        </li>
                        <li><a href="javascript:;">Help</a></li>--->
                        <li><a href="<?php echo base_url() ?>user/logout"><i class="fa fa-sign-out pull-right"></i> Log Out</a></li>
                    </ul>
                </li>


            </ul>
        </nav>
    </div>
</div>