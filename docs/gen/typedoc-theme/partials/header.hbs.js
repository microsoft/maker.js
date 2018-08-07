var header = Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var stack1;
  stack1 = this.invokePartial(partials.breadcrumb, '', 'breadcrumb', depth0, undefined, helpers, partials, data);
  if (stack1 != null) { return stack1; }
  else { return ''; }
  },"3":function(depth0,helpers,partials,data) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression, buffer = "\n                "
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.model : depth0)) != null ? stack1.kindString : stack1), depth0))
    + "&nbsp;\n                "
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.model : depth0)) != null ? stack1.name : stack1), depth0))
    + "\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 != null ? depth0.model : depth0)) != null ? stack1.typeParameters : stack1), {"name":"if","hash":{},"fn":this.program(4, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "            ";
},"4":function(depth0,helpers,partials,data) {
  var stack1, buffer = "                    &lt;\n";
  stack1 = helpers.each.call(depth0, ((stack1 = (depth0 != null ? depth0.model : depth0)) != null ? stack1.typeParameters : stack1), {"name":"each","hash":{},"fn":this.program(5, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "                    &gt;\n";
},"5":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "                        ";
  stack1 = helpers['if'].call(depth0, (data && data.index), {"name":"if","hash":{},"fn":this.program(6, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n                        "
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "\n";
},"6":function(depth0,helpers,partials,data) {
  return ",&nbsp;";
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, lambda=this.lambda, functionType="function", blockHelperMissing=helpers.blockHelperMissing, buffer = "<header>\n    <div class=\"tsd-page-toolbar\">\n        <div class=\"container\">\n            <div class=\"table-wrap\">\n                <div class=\"table-cell\" id=\"tsd-search\" data-index=\""
    + escapeExpression(((helpers.relativeURL || (depth0 && depth0.relativeURL) || helperMissing).call(depth0, "assets/js/search.js", {"name":"relativeURL","hash":{},"data":data})))
    + "\" data-base=\""
    + escapeExpression(((helpers.relativeURL || (depth0 && depth0.relativeURL) || helperMissing).call(depth0, "./", {"name":"relativeURL","hash":{},"data":data})))
    + "\">\n                    <div class=\"field\">\n                        <label for=\"tsd-search-field\" class=\"tsd-widget search no-caption\">Search</label>\n                        <input id=\"tsd-search-field\" type=\"text\" />\n                    </div>\n\n                    <ul class=\"results\">\n                        <li class=\"state loading\">Preparing search index...</li>\n                        <li class=\"state failure\">The search index is not available</li>\n                    </ul>\n\n                    <a href=\""
    + escapeExpression(((helpers.relativeURL || (depth0 && depth0.relativeURL) || helperMissing).call(depth0, "index.html", {"name":"relativeURL","hash":{},"data":data})))
    + "\" class=\"title\">"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.project : depth0)) != null ? stack1.name : stack1), depth0))
    + "</a>\n                </div>\n\n            </div>\n        </div>\n    </div>\n    <div class=\"tsd-page-title\">\n        <div class=\"container\">\n            <ul class=\"tsd-breadcrumb\">\n                ";
  stack1 = helpers['with'].call(depth0, (depth0 != null ? depth0.model : depth0), {"name":"with","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n            </ul>\n            <h1>";
  stack1 = ((helper = (helper = helpers.compact || (depth0 != null ? depth0.compact : depth0)) != null ? helper : helperMissing),(options={"name":"compact","hash":{},"fn":this.program(3, data),"inverse":this.noop,"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.compact) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</h1>\n        </div>\n    </div>\n</header>";
},"usePartial":true,"useData":true});