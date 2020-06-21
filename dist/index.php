<?
session_start();
include_once("inic_globals.php");
include "inc/init.php";
include "inc/init_prefer.php";
include_once("inc/w_incl_cont.php");
include "inc/function2.php";
include "inc/function.php";

include_once("./class/upravimg.class.php");
include_once("./class/sendmail_n.class.php");

if (!isset($_SESSION["lang__"])) $lang__ = 1;
else $lang__ = $_SESSION["lang__"];

if(isset($_GET["lang__"])){
	$lang__ = $_GET["lang__"]; $_SESSION["lang__"] = $_GET["lang__"];
}
/*
if($lang__ == 1) include_once("./class/txt_sk.class.php");
if($lang__ == 2) include_once("./class/txt_en.class.php");
*/

$ada = 0;
if(isset($_REQUEST["seo_link"])) {
	//$ada = getId_fromSeoLink($_REQUEST["seo_link"]);
	$ada = getId($seokeyword_l_menu,$_REQUEST["seo_link"]);	
}elseif(isset($_REQUEST["sitemap"])) {
	$ada = -100;
}elseif(isset($_REQUEST["act"])&& $_REQUEST["act"] == "search"){
	$ada = -50;
}

//echo "ada:".$ada."< <br>";

if($ada == 0){
	//**** kontrola ci ma brat titulku
	if($_zobraz_titulku == 0){
		$ada = getFirstTopMenu($seokeyword_l_menu);
		$first_parent_id = $ada;
	}else{
		$first_parent_id = getFirstTopMenu($seokeyword_l_menu);
	}
}elseif($ada > 0){
	//$ada = getFirstTopMenu($seokeyword_l_menu);
	$first_parent_id = getFirstParentId($seokeyword_l_menu, $ada);
}

//echo "p_id:".$first_parent_id;
//echo "ada:".$ada;

$sqlcat = "SELECT * FROM ".$prefix."menu "
	." WHERE jazyk = '".$lang__."' AND id = '".$ada."' ";
//echo $sqlcat."<br>";
$result = MySQL_dB_Query($databaza, $sqlcat, $spojenie);
//if(mysql_num_rows($result) > 0)
$row = mysql_fetch_object($result);

//KW title desc
if(strlen($row->h1_title) > 0) $h1_title = $row->h1_title;
if(strlen($row->kw) > 0) $kw = $row->kw;
if(strlen($row->descr) > 0) $descr = $row->descr;

$menu_h = getMenuH_obr($seokeyword_l_menu);
//print_r($menu_h);

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
<title><?php echo $h1_title; ?></title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="description" content="<?php echo $descr; ?>" />
<meta name="keywords" content="<?php echo $kw; ?>" />
<meta name="company" content="Spoon Webstudio" />
<meta name="author" content="Spoon Webstudio" />
<meta name="publisher" content="Spoon Webstudio" />
<meta name="copyright" content="Maros Bajla" />
<meta name="language" content="sk" />
<meta name="robots" content="index,follow" />
<meta name="allow-search" content="YES" />
<meta name="distribution" content="global" />
<meta http-equiv="imagetoolbar" content="no" />

<meta name="verify-v1" content="" />


<?
if ($_SERVER[SERVER_NAME]!="localhost") {
	$htacc = "";
}else{
	$htacc = ".";
}
if ($_SERVER[SERVER_NAME]!="localhost") {
	echo "
	<link rel='shortcut icon' href='/i/favicon.ico' />

	<link href='".$htacc."/js/lightbox2/css/lightbox.css' rel='stylesheet' type='text/css' />
	<link href='".$htacc."/css_c/content.css' rel='stylesheet' type='text/css' />
	<link href='".$htacc."/css/screen.css' rel='stylesheet' type='text/css' />
	
	<link href='".$htacc."/mapa/css.css' rel='stylesheet' type='text/css' />
	
	<script type='text/javascript' src='".$htacc."/js/inc/jquery.js'></script>
		
	<script type='text/javascript' src='".$htacc."/js/kalk.js'></script>
	
	
	";
}
?>
	<style type="text/css">
	
		.wysiwygpanel img {
		border:0px;
		/*padding:1px; border:1px solid #7A3A2E;*/
	
	}
	</style>

	<script type="text/javascript">
		function _load_codebook_data(input, codebook, parent) {
			input.removeOption(/./);
				//$.ajaxSetup({
					//type : "GET"
				//});
				//input.ajaxAddOption("http://widgets.m7.sk/codebook.php", "data="+codebook+"&parent="+parent+"&return=json", false);
			$.ajax({
				type: "POST",
				url: "htdocs/codebook.php",
				data: "data="+codebook+"&parent="+parent+"&return=json",
				dataType: "json",
				success: function(data){
					input.addOption(data, false);
				}
			}); 					
		}
	</script>

	<!-- Begin Inspectlet Embed Code -->
	<script type="text/javascript" id="inspectletjs">
		window.__insp = window.__insp || [];
		__insp.push(['wid', 3152704027]);
		(function() {
			function __ldinsp(){var insp = document.createElement('script'); insp.type = 'text/javascript'; insp.async = true; insp.id = "inspsync"; insp.src = ('https:' == document.location.protocol ? 'https' : 'http') + '://www.inspectlet.com/inspectlet.js'; var x = document.getElementsByTagName('script')[0]; x.parentNode.insertBefore(insp, x); }
			if (window.attachEvent){
				window.attachEvent('onload', __ldinsp);
			}else{
				window.addEventListener('load', __ldinsp, false);
			}
		})();
	</script>
	<!-- End Inspectlet Embed Code -->


</head>


<body>
<?php 
	$cat=$ada;
	//print_r($cat_open);
	$cat_open=Array($cat);
	$cat_under=Array($cat);
	$show_only_branch="1";
	get_opened_items($cat,"");
?>
<div id="container">
	
	<?
	// HEADER
	$sql_f = "SELECT content FROM ".$prefix."other WHERE  jazyk = '".$lang__."' 
		AND zaradenie='{$OTHER_TABLE_HEADER}' ";
		//echo $sqlcat;
	$resultdata_f = MySQL_dB_Query($databaza, $sql_f, $spojenie);
	$dbdata_f = MySQL_Fetch_Array($resultdata_f);
	$content_f = $dbdata_f["content"];  
	echo "<div id='top_header'>
		{$content_f}
	</div>";
		
	// horne obr menu
	// vyber obrazka /other/top_menu_bg.jpg
	$style_obr = null;
	$sql_o = "SELECT * FROM ".$prefix."other WHERE  jazyk= '".$lang__."' AND zaradenie='{$OTHER_TABLE_BGTOPMENU}' ";
	$resultdata_o = MySQL_dB_Query($databaza, $sql_o, $spojenie);
	$dbdata_o = MySQL_Fetch_Array($resultdata_o);
	$content_o = $dbdata_o["content"];
	//echo $content_o."<<" ;
	if (file_exists("./other/".$content_o) && strlen($content_o) > 4){
		$style_obr = "style = 'background: url({$DOMENA}/other/{$content_o}) no-repeat ;'";
	}
	echo "<div id='top_menu' {$style_obr}>";
		if($menu_h){			
			foreach($menu_h as $linko=>$obro){
				echo "<div class='menu_obr'>";
					echo "<a href='{$DOMENA}/$linko/'>";
						echo "<img src='{$DOMENA}/other/{$obro}' width='170' height='176' alt='{$linko}'>";
					echo "</a>";
				echo "</div>";
			}
		}
	echo "</div>";
		
  ?>


	<div id="panel2">
		<?
			//LAVY PANEL -->
			echo "<div class='rekl'>";
				$sql_p = "SELECT * FROM ".$prefix."panel WHERE  panel = 1 AND jazyk = '".$lang__."' ";
				//echo $sqlcat;
				$resultdata_p = MySQL_dB_Query($databaza, $sql_p, $spojenie);
				$dbdata_p = MySQL_Fetch_Array($resultdata_p);
				$content_p = $dbdata_p["content"];
	  		echo $content_p;
			echo "</div>";
		
			echo "<div class='nav_top' ></div>";
			echo "<div class='nav'>"; //F7F7F7 //
				echo "<ul class='nav-polozky'>";
					//echo "<li><a class='bordertable'  href='".$DOMENA."'
					//style='font-weight: bold; padding-left:5px; width:195px; '>Úvod</a></li>";
					echo menu_creator($seokeyword_l_menu,$first_parent_id,$first_parent_id,0);
				echo "</ul>";
			echo "</div>";
			echo "<div class='nav_bottom' ></div>";
			//echo "<div style='clear:both; height:10px;'>&nbsp;</div>";
		
		
			/*
			$arr_f_menu = menu_get_first($seokeyword_l_menu);
			//print_r($arr_f_menu);
			if(count($arr_f_menu) > 0){
				foreach($arr_f_menu as $id_f=>$naz_f){
					foreach($naz_f as $nazov=>$hodnota){
						if($nazov == "id") $id_m = $hodnota;
						if($nazov == "title") $title_m = $hodnota;
						if($nazov == "seo_link") $seo_link_m = $hodnota;
						if($nazov == "farba") $farba_m = $hodnota;
					}
					echo "<div class='panel_menu'>";
						$panel_m = getPanelMenu($id_m);
						echo $panel_m;
					echo "</div>";
					$seo_naz_parent = getParentIdNazov($id_m);
					//$seo_naz_parent = $seo_naz_parent."-".$id_m;
					echo "<div class='nav'>"; //F7F7F7 //
						echo "<ul class='nav-polozky'>";
							//echo "<li><a class='bordertable'  href='".$DOMENA."'
							//style='font-weight: bold; padding-left:5px; width:195px; '>Úvod</a></li>";
							echo menu_creator($seokeyword_l_menu,$id_m,$seo_naz_parent,0);
						echo "</ul>";
					echo "</div>";
					echo "<div style='clear:both; height:10px;'>&nbsp;</div>";
				}
			}
			*/
  	
		
		// LAVY PANEL PODLA HLAVNEHO MENU -->
		echo "<div class='rekl'>";
			$sql_p = "SELECT * FROM ".$prefix."panel_menu WHERE  menu_id = '{$first_parent_id}' ";
			//echo $sqlcat;
			$resultdata_p = MySQL_dB_Query($databaza, $sql_p, $spojenie);
			$dbdata_p = MySQL_Fetch_Array($resultdata_p);
			$content_p = $dbdata_p["content"];
  		echo $content_p;
		echo "</div>";		
		
		?>
	</div>


	<?
	// OBSAH
  $content= $row->content;
  $zaradenie = $row->zaradenie;
  echo "<div id='content'>";
		echo "<div class='wysiwygpanel' style='clear:both;'>";
		$seo_first_parent = getParentIdNazovSeo($row->id);
		
		if($ada == 0)
			$zaradenie = "home";
		echo "<div id='cont_link' style='font-size:11px; padding-bottom:10px;' >";
  		echo get_tree_path($zaradenie,$seo_first_parent, "-");
		echo "</div>";

		if($ada == 0){
			$content = getParTable("panel", "content", " AND panel='2' AND jazyk = '{$lang__}' " );
			$zber_rewr_txt = array();
			foreach($conf as $pr_txt=>$pr_target){
				$pos = null;
				$pos = strpos($content, $pr_txt);
				if($pos > 0){
					$res_txt = InclConf($pr_target);
					$zber_rewr_txt[$pr_txt] = $res_txt;
				}					
			}
			if(count($zber_rewr_txt) > 0){
				foreach($zber_rewr_txt as $z_txt=>$z_target){
					$content  = str_replace($z_txt, $z_target, $content);
				}						
			}
			$content  = str_replace("align=\"\"", "", $content);
			
			echo $content;
		}elseif($ada == -100){
			echo "<h1>Sitemap</h1>";
			$sitemap = sitemap();
			echo $sitemap;
		}elseif($ada == -50){
			echo "<h1>Vyhľadávanie</h1>";
			//$sitemap = sitemap();
			echo "Hľadaný výraz:<strong>".$_REQUEST["s_input"]."</strong>";
			echo "<br/><br/>Výsledky:<br/>";
			include "inc/search.php";
		}else{
			$zber_rewr_txt = array();
			foreach($conf as $pr_txt=>$pr_target){
				$pos = null;
				$pos = strpos($content, $pr_txt);
				if($pos > 0){
					$res_txt = InclConf($pr_target);
					$zber_rewr_txt[$pr_txt] = $res_txt;
				}					
			}
			if(count($zber_rewr_txt) > 0){
				foreach($zber_rewr_txt as $z_txt=>$z_target){
					$content  = str_replace($z_txt, $z_target, $content);
				}						
			}
			$content  = str_replace("align=\"\"", "", $content);
			
			echo $content;

			// strankovanie			
			//include_once("strankovanie.php");
		}
		
		
		
		echo "<div style='clear:both; height:5px;'>&nbsp;</div>";
		echo "</div>";
	echo "</div>";
	?>




 <div id="footer">
 	<?php
 		$sql_f = "SELECT content FROM ".$prefix."footer WHERE  jazyk = '".$lang__."' ";
			//echo $sqlcat;
		$resultdata_f = MySQL_dB_Query($databaza, $sql_f, $spojenie);
		$dbdata_f = MySQL_Fetch_Array($resultdata_f);
		$content_f = $dbdata_f["content"];
  	echo $content_f;
 	?>
 </div>
</div>

<script type="text/javascript">

  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-3633551-19']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();

</script>

</body>
</html>





