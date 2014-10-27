<!-- Local testing URL for this file: 
Place in <geoserver data_dir>/www
-->
<html>

    <head>
		<style type="text/css">
        #map { 
            width: 60%; 
            height: 75%; 
            border: solid 2px #808080; 
			}
				/* Custom editing toolbar */
		.customEditingToolbar {
		float: right;
		right: 0px;
		height: 30px;
		width: 200px;
		}
		.customEditingToolbar div {
		float: right;
		margin: 5px;
		width: 24px;
		height: 24px;
		}
		.olControlNavigationItemActive {
		background-image:
		url("../openlayers/theme/default/img/editing_tool_bar.png");
			background-repeat: no-repeat;
		background-position: -103px -23px;
		}
		.olControlNavigationItemInactive {
		background-image:
		url("../openlayers/theme/default/img/editing_tool_bar.png");
		background-repeat: no-repeat;
		background-position: -103px -0px;
		}
		.olControlDrawFeaturePolygonItemInactive {
		background-image:
		url("../openlayers/theme/default/img/editing_tool_bar.png");
		background-repeat: no-repeat;
		background-position: -26px 0px;
		}
		.olControlDrawFeaturePolygonItemActive {
		background-image:
		url("../openlayers/theme/default/img/editing_tool_bar.png");
		background-repeat: no-repeat;
		background-position: -26px -23px;                                                            
		}
		.olControlModifyFeatureItemActive {
		background-image:
		url(../openlayers/theme/default/img/move_feature_on.png);
		background-repeat: no-repeat;
		background-position: 0px 1px;
		}
		.olControlModifyFeatureItemInactive {
		background-image:
		url(../openlayers/theme/default/img/move_feature_off.png);
		background-repeat: no-repeat;
		background-position: 0px 1px;
		}
		.olControlDeleteFeatureItemActive {
		background-image:
		url(../openlayers/theme/default/img/remove_point_on.png);
		background-repeat: no-repeat;
		background-position: 0px 1px;
		}
		.olControlDeleteFeatureItemInactive {
		background-image:
		url(../openlayers/theme/default/img/remove_point_off.png);
		background-repeat: no-repeat;
		background-position: 0px 1px;
		}
		
		table {
		border-collapse:collapse;
		background:#EFF4FB url(http://www.roscripts.com/images/teaser.gif) repeat-x;
		border-left:1px solid #686868;
		border-right:1px solid #686868;
		margin-top: 15px;
		font:0.8em/145% 'Trebuchet MS',helvetica,arial,verdana;
		color: #333;
		}

		td, th {
				padding:5px;
		}

		caption {
				padding: 0 0 .5em 0;
				text-align: left;
				font-size: 1.4em;
				font-weight: bold;
				text-transform: uppercase;
				color: #333;
				background: transparent;
		}

		/* =links
		----------------------------------------------- */

		table a {
				color:#950000;
				text-decoration:none;
		}

		table a:link {}

		table a:visited {
				font-weight:normal;
				color:#666;
				text-decoration: line-through;
		}

		table a:hover {
				border-bottom: 1px dashed #bbb;
		}

		/* =head =foot
		----------------------------------------------- */

		thead th, thead td, tfoot th, tfoot td {
				background:#333 url(http://www.roscripts.com/images/llsh.gif) repeat-x;
				color:#fff
		}

		tfoot td {
				text-align:right
		}

		/* =body
		----------------------------------------------- */

		tbody th, tbody td {
				border-bottom: dotted 1px #333;
		}

		tbody th {
				white-space: nowrap;
		}

		tbody th a {
				color:#333;
		}

		.odd {}

		tbody tr:hover {
				background:#fafafa
		}
		
    </style>
        <script src="http://www.openlayers.org/api/OpenLayers.js"></script>
		<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
        <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.2.6/jquery.js"></script>
		<script type="text/javascript" src="evidenceDescriptorsV1.js">
        </script>
    </head>

<body onload="init()">

	  
        <h2>Evidence for Descriptors Definition V1.0</h2>
        <div id="map"></div>  
		<div id="output-id"></div>
	  <div id="resize-id"></div>
	  <div id="opacity-id">
	  <b>Change active layer opacity: <input type="text" size="3" disabled="true" id="opacity" value="100" /> %</b>
	  <input type="range"  min="0" max="100" value="100" onchange="changeOpacity(this.value)" />
	  </div>
	  <br />
	  <b>Step 1. Select data category to show:</b> <select name="selectCateg" id="selectCateg" onChange="javascript:activateTablesList();" disabled="true"></select>
	  <br />
	  <b>Step 2. Select data to show:</b> <select name="selectTables" id="selectTables" onChange="javascript:activateYearSelector();" disabled="true"></select>
	  <br />
	  <b>Step 3. Select Year and Descriptor:</b> <select name="selectYear" id="selectYear" onChange="javascript:activateAttributesList();" disabled="true"></select>
      <select name="selectAttrib" id="selectAttrib" onChange="javascript:showDataForAttribute();" disabled="true"></select>
	  <br /><input type="checkbox" id="showChoropleth" disabled="true" checked="false" onClick="javascript:choropleth();" /> Display colored map based on descriptor values
	  <br />
	  <div id="data_shown"><table border="1"><thead><tr><td><b>Area</b></td><td><b>Descriptor name</b></td> 
			<td><b>Descriptor value</b></td></tr></thead></table></div>
	  <div id="test"></div>
	</body>
</html>
