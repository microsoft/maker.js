var default = Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, lambda=this.lambda, escapeExpression=this.escapeExpression, functionType="function", helperMissing=helpers.helperMissing, buffer = "---\r\nlayout: posts\r\ntitle: Api - "
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.model : depth0)) != null ? stack1.name : stack1), depth0))
    + " "
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.model : depth0)) != null ? stack1.kindString : stack1), depth0))
    + "\r\n---\r\n\r\n<div class=\"container container-main toggle-visibilityprivate toggle-public\">\r\n\r\n    ";
  stack1 = ((helper = (helper = helpers.contents || (depth0 != null ? depth0.contents : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"contents","hash":{},"data":data}) : helper));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n\r\n</div>\r\n\r\n";
  stack1 = this.invokePartial(partials.footer, '', 'footer', depth0, undefined, helpers, partials, data);
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"usePartial":true,"useData":true});