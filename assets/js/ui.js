/* ============================================================
   Momentum · ui.js — toast, modal, drawer, confirm/prompt,
   form field helpers
   ============================================================ */
(function (w) {
  "use strict";
  var M = w.M;

  /* ---------------- toast ---------------- */
  var tHost = null;
  M.toast = function (msg, kind, actLabel, actFn) {
    tHost = tHost || M.$("#toast");
    if (!tHost) return;
    tHost.className = "glass toast" + (kind ? " " + kind : "");
    tHost.innerHTML = M.icon(kind === "no" ? "alert" : "checkCircle") + "<span>" + M.esc(msg) + "</span>";
    if (actLabel) {
      var b = M.el("button", null, M.esc(actLabel));
      b.onclick = function () { actFn && actFn(); M.hideToast(); };
      tHost.appendChild(b);
    }
    tHost.classList.add("show");
    clearTimeout(tHost._t);
    tHost._t = setTimeout(M.hideToast, actLabel ? 5200 : 2100);
  };
  M.hideToast = function () { if (tHost) tHost.classList.remove("show"); };

  /* ---------------- modal ---------------- */
  M.modal = function (o) {
    var ov = M.$("#modalHost");
    var cls = "glass modal" + (o.wide ? " wide" : o.narrow ? " narrow" : "");
    ov.innerHTML = '<div class="' + cls + '">'
      + '<div class="modal-h"><div><h3>' + M.esc(o.title || "") + "</h3>"
      + (o.sub ? '<div class="sub">' + o.sub + "</div>" : "")
      + '</div><button class="icb bare x" data-mclose="1" aria-label="Close">' + M.icon("x") + "</button></div>"
      + '<div class="modal-b" id="modalBody"></div>'
      + '<div class="modal-f" id="modalFoot"></div></div>';
    var body = M.$("#modalBody", ov);
    if (typeof o.body === "string") body.innerHTML = o.body;
    else if (o.body) body.appendChild(o.body);
    var foot = M.$("#modalFoot", ov);
    (o.footer || []).forEach(function (f) {
      var b = M.el("button", "btn " + (f.cls || ""), (f.icon ? M.icon(f.icon) : "") + "<span>" + M.esc(f.label) + "</span>");
      b.onclick = function () { f.fn && f.fn(body); };
      foot.appendChild(b);
    });
    if (!(o.footer || []).length) foot.style.display = "none";
    ov.classList.add("show");
    M.$$("[data-mclose]", ov).forEach(function (x) { x.onclick = M.closeModal; });
    if (o.onOpen) o.onOpen(body);
    var first = M.$(".inp,.sel", body);
    if (first && o.focus !== false) setTimeout(function () { first.focus(); }, 90);
    return M.closeModal;
  };
  M.closeModal = function () {
    var ov = M.$("#modalHost");
    if (ov) { ov.classList.remove("show"); ov.innerHTML = ""; }
  };
  M.confirm = function (title, msg, okLabel, danger) {
    return new Promise(function (res) {
      M.modal({
        title: title, narrow: true,
        body: '<div class="note">' + M.esc(msg || "") + "</div>",
        footer: [
          { label: "Cancel", cls: "ghost", fn: function () { M.closeModal(); res(false); } },
          { label: okLabel || "Confirm", cls: danger ? "danger" : "primary", fn: function () { M.closeModal(); res(true); } }
        ]
      });
    });
  };
  M.ask = function (title, label, value, o) {
    o = o || {};
    return new Promise(function (res) {
      M.modal({
        title: title, narrow: true,
        body: '<div class="fld"><label>' + M.esc(label) + '</label><input class="inp" id="askIn" type="' + (o.type || "text") + '" value="' + M.esc(value == null ? "" : value) + '" placeholder="' + M.esc(o.ph || "") + '"></div>'
          + (o.hint ? '<div class="hint">' + M.esc(o.hint) + "</div>" : ""),
        footer: [
          { label: "Cancel", cls: "ghost", fn: function () { M.closeModal(); res(null); } },
          {
            label: o.ok || "Save", cls: "primary", fn: function (b) {
              var v = M.$("#askIn", b).value;
              M.closeModal(); res(v);
            }
          }
        ],
        onOpen: function (b) {
          M.$("#askIn", b).addEventListener("keydown", function (e) {
            if (e.key === "Enter") { var v = e.target.value; M.closeModal(); res(v); }
          });
        }
      });
    });
  };

  /* ---------------- drawer ---------------- */
  M.drawer = function (o) {
    var d = M.$("#drawerHost");
    d.innerHTML = '<div class="drawer-h"><div class="grow"><h3 style="font-size:var(--fs-16)">' + M.esc(o.title || "") + "</h3>"
      + (o.sub ? '<div style="font-size:var(--fs-11);color:var(--muted);margin-top:2px">' + o.sub + "</div>" : "")
      + '</div><button class="icb bare" data-dclose="1">' + M.icon("x") + "</button></div>"
      + '<div class="drawer-b" id="drawerBody"></div><div class="drawer-f" id="drawerFoot"></div>';
    var body = M.$("#drawerBody", d);
    if (typeof o.body === "string") body.innerHTML = o.body; else if (o.body) body.appendChild(o.body);
    var foot = M.$("#drawerFoot", d);
    (o.footer || []).forEach(function (f) {
      var b = M.el("button", "btn " + (f.cls || "") + " grow", (f.icon ? M.icon(f.icon) : "") + "<span>" + M.esc(f.label) + "</span>");
      b.onclick = function () { f.fn && f.fn(body); };
      foot.appendChild(b);
    });
    if (!(o.footer || []).length) foot.style.display = "none";
    M.$("#drawerScrim").classList.add("show");
    d.classList.add("show");
    M.$$("[data-dclose]", d).forEach(function (x) { x.onclick = M.closeDrawer; });
    if (o.onOpen) o.onOpen(body);
    return M.closeDrawer;
  };
  M.closeDrawer = function () {
    var d = M.$("#drawerHost");
    if (d) { d.classList.remove("show"); setTimeout(function () { if (!d.classList.contains("show")) d.innerHTML = ""; }, 320); }
    var s = M.$("#drawerScrim"); if (s) s.classList.remove("show");
  };

  /* ---------------- form helpers ---------------- */
  var f = (M.f = {});
  f.text = function (k, label, v, o) {
    o = o || {};
    return '<div class="fld"' + (o.style ? ' style="' + o.style + '"' : "") + "><label>" + M.esc(label) + (o.req ? ' <i class="req">*</i>' : "") + "</label>"
      + '<input class="inp" data-k="' + k + '" type="' + (o.type || "text") + '" value="' + M.esc(v == null ? "" : v) + '"'
      + (o.ph ? ' placeholder="' + M.esc(o.ph) + '"' : "")
      + (o.step ? ' step="' + o.step + '"' : "") + (o.min != null ? ' min="' + o.min + '"' : "") + (o.max != null ? ' max="' + o.max + '"' : "")
      + (o.attr || "") + ">"
      + (o.hint ? '<div class="hint">' + M.esc(o.hint) + "</div>" : "") + "</div>";
  };
  f.num = function (k, label, v, o) {
    o = o || {}; o.type = "number";
    return f.text(k, label, v, o);
  };
  f.date = function (k, label, v, o) {
    o = o || {}; o.type = "date";
    return f.text(k, label, v, o);
  };
  f.sel = function (k, label, v, opts, o) {
    o = o || {};
    var h = '<div class="fld"><label>' + M.esc(label) + "</label><select class=\"sel\" data-k=\"" + k + "\">";
    opts.forEach(function (op) {
      var val = Array.isArray(op) ? op[0] : op, lab = Array.isArray(op) ? op[1] : op;
      h += '<option value="' + M.esc(val) + '"' + (String(val) === String(v) ? " selected" : "") + ">" + M.esc(lab) + "</option>";
    });
    return h + "</select>" + (o.hint ? '<div class="hint">' + M.esc(o.hint) + "</div>" : "") + "</div>";
  };
  f.area = function (k, label, v, o) {
    o = o || {};
    return '<div class="fld"><label>' + M.esc(label) + "</label><textarea class=\"inp\" data-k=\"" + k + '" placeholder="' + M.esc(o.ph || "") + '">' + M.esc(v || "") + "</textarea></div>";
  };
  f.checks = function (k, label, vals, opts) {
    var h = '<div class="fld"><label>' + M.esc(label) + '</label><div class="pills" data-checks="' + k + '">';
    opts.forEach(function (op) {
      var val = Array.isArray(op) ? op[0] : op, lab = Array.isArray(op) ? op[1] : op;
      h += '<button type="button" class="pill' + ((vals || []).indexOf(val) >= 0 ? " on" : "") + '" data-v="' + M.esc(val) + '">' + M.esc(lab) + "</button>";
    });
    return h + "</div></div>";
  };
  f.dictOpts = function (dict) {
    return Object.keys(dict).map(function (k) { return [k, dict[k]]; });
  };
  /* read all [data-k] fields + pill groups inside a container */
  M.formVals = function (box) {
    var out = {};
    M.$$("[data-k]", box).forEach(function (i) {
      var k = i.dataset.k, v = i.value;
      if (i.type === "number") v = v === "" ? null : parseFloat(v);
      out[k] = typeof v === "string" ? v.trim() : v;
    });
    M.$$("[data-checks]", box).forEach(function (g) {
      out[g.dataset.checks] = M.$$(".pill.on", g).map(function (p) { return p.dataset.v; });
    });
    return out;
  };
  /* pill group toggling (delegated once) */
  document.addEventListener("click", function (e) {
    var p = e.target.closest("[data-checks] .pill");
    if (p) { p.classList.toggle("on"); }
  });
})(window);
