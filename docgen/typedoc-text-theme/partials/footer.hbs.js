var footer = Handlebars.template({"1":function(depth0,helpers,partials,data) {
  return "    <div class=\"container tsd-generator\">\r\n        <p>Generated using <a href=\"http://typedoc.io\" target=\"_blank\">TypeDoc</a></p>\r\n    </div>\r\n";
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\r\n";
  stack1 = helpers.unless.call(depth0, ((stack1 = (depth0 != null ? depth0.settings : depth0)) != null ? stack1.hideGenerator : stack1), {"name":"unless","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"useData":true});