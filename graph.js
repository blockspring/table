var graph = {
  svg: null,
  chart: null,
  gradient: null,
  nestData: function() {
      var data = Block.vars.csv.data;

      var parsedData = data.map(function(row, i){
        var output_data = {};
        Block.vars.csv.columnRoleMap.columns.forEach(function(column){
          if (row[column] == 0 || row[column] == false){
            output_data[column] = row[column];  
          } else {
            output_data[column] = row[column] || "";
          }
        })
        return output_data;
      })

      return parsedData;
    },
    draw: function (){
      var svgInput = "#myGrid";

      

      var data = graph.nestData();

      $(svgInput).empty();

      var height = $(window).height() - 60;
      var width = $(window).width();

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

      // Get text alignment (currently for all columns, in future may be specific).
      var alignment = Block.vars.column_text_alignment;
      var alignmentClass = [];
      var alignment_type = "array"
      console.log(alignment);

      if (typeof alignment == "string"){
        alignment = alignment[0];
        alignment_type = "string";
      } else if (!alignment){
        alignment = "left";
        alignment_type = "string";
      }  else {
        alignment.forEach(function(d){
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
        })
      }

      column_titles.forEach(function(d, i){
        var output_object = {
          id: d, name: d, field: d, width: 120, sortable: true, toolTip: d
        }
        if (Block.vars.column_widths && Block.vars.column_widths[i] != null ) {
          output_object.width = parseInt(Block.vars.column_widths[i]);
        }
        
        // Apply formatters.
        if (gradient_list.indexOf(d) == -1){
          output_object.formatter = regular_formatter;
        } else {
          output_object.formatter = gradient_formatter;
        }
        
        // Apply font options
        if (alignment_type == "array"){
          var output_class = [alignmentClass[i]];
        } else {
          var output_class = [alignment];
        }

        output_object.cssClass = output_class.join(' ');
        columns.push(output_object);
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
        if (!Block.vars.gridlines) {
          $('#myGrid').addClass('noGridLines');
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

        // we may want to include a border bottom
      if (Block.vars.border_bottom){
        columnHeaders
          .style('border-bottom', '1px solid black');
      }   

      var columnHeaderText = columnHeaders
        .select('.slick-column-name').style('color', Block.vars.header_font_color)
        .style('text-align', function(d,i){
          if (alignment_type == "array"){
            return alignment[i];
          } else {
            return alignment;
          }
        })
        .style('font-size', font_height + "px")
        .style('height', column_header_height + "px")
        .style('line-height', column_header_height / 1.5 + "px");

      if (Block.vars.enable_text_shadow){
        columnHeaderText
          .style("text-shadow", "1px 1px "+ text_shadow_color);
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

    },
    redraw: function(){
      graph.draw();
    },
    
    calculateGradient: function(){
      // graph.gradient = {};
      // Block.vars.gradient.forEach(function(d){
      //   graph.gradient[d[3]] = {};
      //   graph.gradient[d[3]].attribute = d[0];
      //   graph.gradient[d[3]].scale = d3.scale.linear()
      //       .domain(d3.extent(window.graphData.xfData.group.groupFilterable.top(Infinity), function(e){
      //         var this_series = e.key.split("||")[1];
      //         if (this_series == d[3]){
      //           return +e.value[d[0]];
      //         }
      //       }))
      //       .range([d[1],d[2]]);
      // })
    },
    
    barSubstitute: function(){
      // if (Block.vars.gradient.length > 0){
      //   d3.selectAll("rect.nv-bar")
      //     .style("fill", function(d){
      //       var output;
      //       var series_options = window.graphData.parseData.parsedData.series;
      //       series_options.forEach(function(e,i){
      //         if (+d.series == +i){
      //           output = graph.gradient[e].scale(d.values[0].value[Block.vars.custom_y])
      //         }
      //       })
      //       return output;  
      //   });
      // }

      // $('.nv-axisMaxMin').empty();
    },
}