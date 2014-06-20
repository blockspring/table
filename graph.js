var graph = {
  svg: null,
  chart: null,
  gradient: null,
  nestData: function() {
    var data = Block.vars.csv.data;

    var histo_array = {};

    Block.vars.csv.columnRoleMap.columns.forEach(function(column, i){
      histo_array[i] = [];
    })

    var parsedData = data.map(function(row, i){
      var output_data = {};
      Block.vars.csv.columnRoleMap.columns.forEach(function(column, j){
        histo_array[j].push(row[column]);
        if (row[column] == 0 || row[column] == false){
          output_data[column] = row[column];  
        } else {
          output_data[column] = row[column] || "";
        }
      });
      return output_data;
    });

    return {
      data: parsedData,
      histoArray: histo_array
    };
  },
  draw: function (){
    var svgInput = "#myGrid";

    var bigData = graph.nestData();
    var data = bigData.data;
    var histoArray = bigData.histoArray;

    $(svgInput).empty();

    var height = $(document).height() - 60;
    var width = $(document).width();

    if (Block.vars.csv.columnRoleMap.grafly_dropdowns.length != 0){
      $('#myGrid').css('top',60);
      height = height - 60;
    }

    var grid;
    var column_titles = Object.keys(data[0]);

    var scales = {};
    var gradient_list = [];

    if (Block.vars.gradient) {
      Block.vars.gradient.forEach(function(d,i){
        var variable_name = column_titles[i];
        var start_color = d[0];
        var end_color = d[1];

        if (Block.vars.csv.columnMetaData[variable_name] && Block.vars.csv.columnMetaData[variable_name].type != 'string'){
          scales[variable_name] = d3.scale.linear()
            .domain(d3.extent(data, function(e){
                return e[variable_name];
              }))
            .range([start_color, end_color]);
            gradient_list.push(variable_name);
        } else if (Block.vars.csv.columnMetaData[variable_name] && Block.vars.csv.columnMetaData[variable_name].type == 'string'){
          scales[variable_name] = d3.scale.linear()
            .domain([0, Block.vars.csv.columnMetaData[variable_name].uniques.length - 1])
            .range([start_color, end_color]);
          gradient_list.push(variable_name);
        } 
      });
    }

    var columns = [];

    // Get text alignment.
    var column_alignments = Block.vars.column_text_alignment;
    var alignmentClass = [];
    var alignment_type = "array"
    console.log(column_alignments);

    if (typeof column_alignments == "string"){
      column_alignments = column_alignments[0];
      alignment_type = "string";
    } else if (!column_alignments){
      column_alignments = "left";
      alignment_type = "string";
    }  else {
      column_alignments.forEach(function(d){
        switch (d) {
          case "left":
            alignmentClass.push("text-left");
            break;
          case "center":
            alignmentClass.push("text-center");
            break;
          case "right":
            alignmentClass.push("text-right");
            break;
          default:
            console.log("Not given a supported alignment class");
            alignmentClass.push("text-left");
            break;
        }
      });
    }

    column_titles.forEach(function(column_name, i){
      var column = {
        id: column_name, 
        name: column_name, 
        field: column_name, 
        width: 120, 
        sortable: true, 
        toolTip: column_name
      }

      //  Apply column widths
      if (Block.vars.column_widths && Block.vars.column_widths[i]) {
        column.minWidth = column.maxWidth = column.width = parseInt(Block.vars.column_widths[i]);
      }
      
      // Apply formatters.
      if (gradient_list.indexOf(column_name) == -1){
        column.formatter = regular_formatter;
      } else {
        column.formatter = gradient_formatter;
      }
      
      // Apply font options
      if (alignment_type == "array"){
        var column_class = [alignmentClass[i]];
      } else {
        var column_class = [column_alignments];
      }

      column.cssClass = column_class.join(' ');
      columns.push(column);
    });

    // render
    var options = {
      enableCellNavigation: true,
      enableColumnReorder: false,
      multiColumnSort: true,
      forceFitColumns: Block.vars.forcefit_columns != null ? 
        Block.vars.forcefit_columns : 
        true
    };

    $(function () {
      grid = new Slick.Grid(svgInput, data, columns, options);

      grid.onSort.subscribe(function (e, args) {
        var cols = args.sortCols;

        data.sort(function (dataRow1, dataRow2) {
          for (var i = 0, l = cols.length; i < l; i++) {
            var field = cols[i].sortCol.field;
            var sign = cols[i].sortAsc ? 1 : -1;
            var value1 = dataRow1[field], value2 = dataRow2[field];
            var result = (value1 == value2 ? 0 : (value1 > value2 ? 1 : -1)) * sign;
            if (result != 0) {
              return result;
            }
          }
          return 0;
        });

        grid.invalidate();

        grid.render();
      });

      // Option - boolean - turns gridlines on or off. 
      if (!Block.vars.show_gridlines) {
        $('#myGrid').addClass('noGridLines');
      } 

      if (Block.vars.vertical_gridline_colors) {
        var vertical_gridline_css = ' \
          <style> \
            #myGrid .slick-cell { \
              border-right-color: ' + Block.vars.vertical_gridline_colors + '; \
            } \
          </style> \
        ';

        $('head').append(vertical_gridline_css);
      }

      if (Block.vars.horizontal_gridline_colors) {
        var horizontal_gridline_css = ' \
          <style> \
            #myGrid .slick-cell { \
              border-bottom-color: ' + Block.vars.horizontal_gridline_colors + '; \
            } \
          </style> \
        ';

        $('head').append(horizontal_gridline_css);
      }

      if (Block.vars.striped_rows) {
        var striped_row_css = ' \
          <style> \
            #myGrid .slick-row.even .slick-cell { \
              background: #f9f9f9; \
            } \
            #myGrid .slick-row.even .slick-cell * { \
              background: #f9f9f9 !important; \
            } \
          </style> \
        ';

        $('head').append(striped_row_css);
      }

      if (Block.vars.hover_rows) {
        $('#myGrid').addClass('hoverRows');
      }
    });

    var font_height = Block.vars.header_font_size;
    var adj_font_height = font_height;
    var column_header_height = adj_font_height > 20 ? adj_font_height * 1.5 : 25;

    var text_shadow_color = Block.vars.text_shadow_color;

    // post-slickgrid rending style
    var columnHeaders = d3.selectAll('.slick-header-column')
      .style('background-color', Block.vars.header_background_color)
      .style('height', column_header_height + "px");

    // Border bottom option
    if (Block.vars.border_bottom){
      columnHeaders
        .style('border-bottom', '1px solid black');
    }   

    var columnHeaderText = columnHeaders
      .select('.slick-column-name').style('color', Block.vars.header_font_color)
      .style('text-align', function(d,i){
        if (alignment_type == "array"){
          return column_alignments[i];
        } else {
          return column_alignments;
        }
      })
      .style('font-size', font_height + "px")
      .style('height', column_header_height + "px")
      .style('line-height', column_header_height / 1.8 + "px");

    if (Block.vars.enable_text_shadow){
      columnHeaderText.style("text-shadow", "1px 1px "+ text_shadow_color);
    }

    function gradient_formatter(row, cell, value, columnDef, dataContext){
      var header_name = column_titles[cell];
      if (Block.vars.csv.columnMetaData[header_name].type == 'string'){
        var indexValue = Block.vars.csv.columnMetaData[header_name].uniques.indexOf(value);
        var color = scales[header_name](indexValue);
      } else {
        var color = scales[header_name](value);
      }

      var originalValue = Block.vars.csv.columnMetaData[header_name].formatLibrary[value];
      return '<p style="position: absolute; top: 0; bottom: 0; left: 0; right: 0; padding: 4px 6px; background:' + color + '">' + originalValue + '</p>';
    }

    function regular_formatter(row, cell, value, columnDef, dataContext) {
      var header_name = columnDef.name;
      var originalValue = Block.vars.csv.columnMetaData[header_name].formatLibrary[value];
      return originalValue;
    }

    if (Block.vars.histo_enable){
      d3.selectAll('.slick-header-column').on('mouseover', function(err, i){
        var column_width = $($('.slick-header-column')[i]).width();
        var column_height = $($('.slick-header-column')[i]).height();
        var left_position = $($('.slick-header-column')[i]).offset().left;

        var variable_type = Block.vars.csv.columnMetaData[$($('.slick-header-column')[i])[0].title].type;
        
        if (variable_type != "string"){
            d3.select('#tooltip').classed('hidden', false)
              .style('width', column_width)
              .style('height', column_height * 3)
              .style('top', column_height)
              .style('left', left_position)
              .style('z-index', 2);

            renderHistogram(histoArray[i], "#tooltip")
          }
      }).on("mouseout", function () {
            d3.select('#tooltip').classed('hidden', true);
          })
    }

    function renderHistogram(data_array, tooltip_div){
      $(tooltip_div).empty();

      var margin = {top: 5, right: 5, bottom: 5, left: 5};
      var width = $(tooltip_div).width() - margin.top - margin.bottom;
      var height = $(tooltip_div).height() - margin.right - margin.left;

      var x_min = d3.min(data_array, function(d){return d;});
      var x = d3.scale.linear()
          .domain([x_min, d3.max(data_array, function(d){return d;})])
          .range([0, width]);

      // Generate a histogram using twenty uniformly-spaced bins.
      var data = d3.layout.histogram()
          .bins(x.ticks(Block.vars.histo_ticks))
          (data_array);

      var y = d3.scale.linear()
          .domain([0, d3.max(data, function(d) { return d.y; })])
          .range([height, 0]);

      var svg = d3.select(tooltip_div).append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var bar = svg.selectAll(".bar")
          .data(data)
        .enter().append("g")
          .attr("class", "bar")
          .style("fill", Block.vars.histo_color)
          .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

      bar.append("rect")
          .attr("x", 1)
          .attr("width", x(x_min + data[0].dx) - 1)
          .attr("height", function(d) { return height - y(d.y); });
    }
  },
  redraw: function(){
    graph.draw();
  }
}