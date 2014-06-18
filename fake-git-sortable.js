function drawGraph(csv_data) {
  var grid;
  var column_titles = Object.keys(csv_data[0]);

  var columns = [];
  column_titles.forEach(function(d){
    columns.push({ id: d, name: d, field: d, width: 120, sortable: true });
  });

  var options = {
    enableCellNavigation: true,
    enableColumnReorder: false,
    multiColumnSort: true
  };

  $(function () {
    var data = [];

    // Potentially inefficient. 
    csv_data.forEach(function(d){
      data.push(d)
    });

    grid = new Slick.Grid("#myGrid", data, columns, options);

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
  });
}