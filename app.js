// ═══════════════════ STATE & STORAGE ═══════════════════
const SK='ot_v7';
const SEED=__SEED__;
const CSV_FIELDS=['id','ticker','type','openDate','expiry','strike','premium','contracts','underlying','iv','delta','dte','notes','totalCredit','status','closedDate','closeCost','outcome','pnl','feesOpen','feesClose','feesTotal','pnlNet'];

let state={
  trades:[],nextId:1,
  settings:{
    theme:'dark',
    monthlyTarget:500,
    capital:[
      {id:'usd',label:'USD Account',currency:'USD',amount:0,enabled:true},
      {id:'sgd',label:'SGD Account',currency:'SGD',amount:0,enabled:false},
    ],
    fxRates:{USDSGD:1.34},marginPct:20,
    fees:{preset:'tiger-ultra',gst:true,gstRate:9,includePassThrough:true,orf:0.012,occ:0.025,finraTaf:0.00329,commissionRate:0.35,platformRate:0.30,minOrderFee:0,minPlatformFee:0,model:'perContract',stockRate:0},
    logFields:['strike','premium','contracts','iv','delta','notes'],
    histCols:[
      {key:'ticker',label:'Ticker',on:true},{key:'type',label:'Type',on:true},
      {key:'strike',label:'Strike',on:true},{key:'openDate',label:'Open',on:true},
      {key:'closedDate',label:'Close',on:true},{key:'dte',label:'DTE',on:true},
      {key:'premium',label:'Premium',on:true},{key:'pnl',label:'P&L',on:true},
      {key:'pnlPct',label:'P&L%',on:true},{key:'capEff',label:'P&L/Collat',on:true},
      {key:'aroc',label:'AROC',on:false},{key:'iv',label:'IV%',on:false},
      {key:'delta',label:'Delta',on:false},{key:'outcome',label:'Outcome',on:true},
      {key:'fees',label:'Fees',on:true},{key:'pnlNet',label:'Net P&L',on:true},
      {key:'notes',label:'Notes',on:false},
    ],
  }
};

function save(){try{localStorage.setItem(SK,JSON.stringify(state));}catch(e){}}
function load(){
  try{
    let r=localStorage.getItem(SK);
    if(!r){const lg=localStorage.getItem('ot_v6')||localStorage.getItem('ot_v5')||localStorage.getItem('ot_v4');if(lg){localStorage.setItem(SK,lg);r=lg;}}
    if(r){
      const sv=JSON.parse(r);
      state.trades=sv.trades||SEED;
      state.nextId=sv.nextId||(Math.max(...(sv.trades||SEED).map(t=>t.id||0))+1);
      if(sv.settings){
        state.settings={...state.settings,...sv.settings};
        if(!state.settings.monthlyTarget)state.settings.monthlyTarget=500;
        if(!state.settings.monthlyTargetMode)state.settings.monthlyTargetMode='amount';
        if(!state.settings.capital)state.settings.capital=[{id:'usd',label:'USD Account',currency:'USD',amount:0,enabled:true},{id:'sgd',label:'SGD Account',currency:'SGD',amount:0,enabled:false}];
        state.settings.fees={...state.settings.fees,...(sv.settings.fees||{})};
      }
    }else{state.trades=SEED;state.nextId=15;save();}
  }catch(e){state.trades=SEED;state.nextId=15;}
}

// ═══════════════════ HELPERS ═══════════════════
function setTheme(t){state.settings.theme=t;document.documentElement.setAttribute('data-theme',t);const m=document.getElementById('theme-meta');if(m)m.setAttribute('content',t==='dark'?'#0f0f1a':'#f4f5f7');save();}
let _tt;function toast(msg,type=''){const el=document.getElementById('toast');el.textContent=msg;el.className='toast show'+(type?' toast-'+type:'');clearTimeout(_tt);_tt=setTimeout(()=>el.classList.remove('show'),2400);}
function calcDTE(expiry,from){if(!expiry)return 0;return Math.max(0,Math.round((new Date(expiry)-(from?new Date(from):new Date()))/86400000));}
function capEff(t){if(t.type==='Stock Sale'||t.pnl==null)return null;const cap=t.strike*t.contracts*100;return cap>0?(t.pnl/cap)*100:null;}
function aroc(t){const ce=capEff(t);return(ce!==null&&t.dte>0)?(ce/t.dte)*365:null;}
function netPnl(t){if(t.pnl==null)return null;return+(t.pnl-(t.feesTotal||0)).toFixed(2);}
function badgeClass(type){return{CSP:'b-csp',CC:'b-cc',Diagonal:'b-diag','Stock Sale':'b-stock'}[type]||'b-other';}
function outcomeClass(o){return{Expired:'b-expired',Assigned:'b-assigned',Sold:'b-sold',Closed:'b-closed'}[o]||'b-closed';}
function fmt(n,d=2){return n==null?'-':'$'+Math.abs(+n).toFixed(d);}
function fmtSgn(n,d=2){if(n==null)return'-';return(n>=0?'+':'-')+'$'+Math.abs(+n).toFixed(d);}
function esc(s){const d=document.createElement('div');d.textContent=String(s??'');return d.innerHTML;}

const PRESETS={
  'tiger-ultra':{name:'Tiger Ultra-low',sub:'$0.65/contract',model:'perContract',commissionRate:0.35,platformRate:0.30,minOrderFee:0,minPlatformFee:0,includePassThrough:true,stockRate:5.07},
  'tiger-regular':{name:'Tiger Regular',sub:'Min $2.99/order',model:'perOrder',commissionRate:1.99,platformRate:1.00,minOrderFee:1.99,minPlatformFee:1.00,includePassThrough:true,stockRate:5.07},
  'moomoo-fixed':{name:'Moomoo Fixed',sub:'Min $1.99',model:'perContract',commissionRate:0.65,platformRate:0.30,minOrderFee:1.99,minPlatformFee:0.99,includePassThrough:true,stockRate:0},
  'ibkr':{name:'IBKR',sub:'$0.65/contract',model:'perContract',commissionRate:0.65,platformRate:0,minOrderFee:1.00,minPlatformFee:0,includePassThrough:true,stockRate:0},
  'free':{name:'Commission-free',sub:'$0 fees',model:'perContract',commissionRate:0,platformRate:0,minOrderFee:0,minPlatformFee:0,includePassThrough:false,stockRate:0},
  'custom':{name:'Custom',sub:'Set your own rates',model:'perContract',commissionRate:0,platformRate:0,minOrderFee:0,minPlatformFee:0,includePassThrough:true,stockRate:0},
};

function calcFees(trade,outcome){
  const f=state.settings.fees||{};
  if(f.preset==='free')return{feesOpen:0,feesClose:0,feesTotal:0};
  if(trade.type==='Stock Sale'){const fee=+(f.stockRate||0).toFixed(4);return{feesOpen:fee,feesClose:0,feesTotal:fee};}
  const pKey=f.preset||'custom';const p=PRESETS[pKey]||f;
  const contracts=trade.contracts||1;
  const commRate=pKey!=='custom'?p.commissionRate:(f.commissionRate||0);
  const platRate=pKey!=='custom'?p.platformRate:(f.platformRate||0);
  const minOrder=pKey!=='custom'?p.minOrderFee:(f.minOrderFee||0);
  const minPlat=pKey!=='custom'?p.minPlatformFee:(f.minPlatformFee||0);
  const model=pKey!=='custom'?p.model:(f.model||'perContract');
  let openBroker=model==='perOrder'?Math.max(commRate,minOrder)+Math.max(platRate,minPlat):Math.max(commRate*contracts,minOrder)+Math.max(platRate*contracts,minPlat);
  const inclPT=pKey!=='custom'?p.includePassThrough:(f.includePassThrough!==false);
  let pt=inclPT?((f.orf||0.012)+(f.occ||0.025))*contracts:0;
  const gstM=f.gst!==false?(1+(f.gstRate||9)/100):1;
  const feesOpen=+((openBroker+pt)*gstM).toFixed(4);
  const o=outcome||trade.outcome;
  const feesClose=(o!=='Expired'&&o!=='Assigned')?feesOpen:0;
  return{feesOpen,feesClose,feesTotal:+(feesOpen+feesClose).toFixed(4)};
}

function recomputeFees(scope){
  let count=0;
  state.trades.forEach(t=>{
    if(scope==='open'&&t.status!=='open')return;
    if(t.status==='open'){
      const fc=calcFees(t,null);
      t.feesOpen=fc.feesOpen;t.feesClose=0;t.feesTotal=fc.feesOpen;
      count++;
    } else if(t.pnl!=null){
      const fc=calcFees(t,t.outcome);
      t.feesOpen=fc.feesOpen;t.feesClose=fc.feesClose;t.feesTotal=fc.feesTotal;
      t.pnlNet=+(t.pnl-t.feesTotal).toFixed(2);
      count++;
    }
  });
  save();toast('Updated '+count+' trades');
}
function showManualFeeEdit(){
  // Build a list of recent closed trades for manual fee override
  const closed=state.trades.filter(t=>t.status==='closed').slice(0,20);
  const sub=document.getElementById('s-sub-view');
  sub.innerHTML=S_BACK+`<div class="sub-title">Edit trade fees</div>
  <div class="sub-desc">Override fees for individual trades. Changes only affect the selected trade and recalculate its net P&L.</div>
  <div class="s-group">`+closed.map(t=>`
    <div style="padding:10px 16px;border-bottom:.5px solid var(--border)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="font-size:13px;font-weight:600">${esc(t.ticker)} ${esc(t.type)} · ${t.closedDate||t.openDate}</div>
        <div style="font-size:12px;color:var(--text2)">P&L: ${t.pnl!=null?(t.pnl>=0?'+':'')+t.pnl.toFixed(2):'-'}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <div style="flex:1"><label style="font-size:10px;color:var(--text2);font-weight:600;letter-spacing:.03em;text-transform:uppercase">Total fees</label>
          <input type="number" value="${(t.feesTotal||0).toFixed(4)}" step="0.01" style="margin-top:3px"
            onchange="overrideTradesFees(${t.id},parseFloat(this.value)||0)">
        </div>
        <div style="font-size:12px;color:var(--text2);margin-top:16px">net: <span style="font-weight:700;color:${(t.pnlNet||0)>=0?'var(--pos)':'var(--neg)'}" id="net-${t.id}">${t.pnlNet!=null?(t.pnlNet>=0?'+':'')+t.pnlNet.toFixed(2):'-'}</span></div>
      </div>
    </div>`).join('')+`</div>`;
}
function overrideTradesFees(id,newFees){
  const t=state.trades.find(x=>x.id===id);if(!t)return;
  t.feesTotal=newFees;
  if(t.pnl!=null)t.pnlNet=+(t.pnl-newFees).toFixed(2);
  save();
  const el=document.getElementById('net-'+id);
  if(el)el.textContent=(t.pnlNet>=0?'+':'')+t.pnlNet.toFixed(2);
}

function recomputeAllFees(){
  state.trades.forEach(t=>{
    if(t.status==='closed'&&t.pnl!=null){
      const fc=calcFees(t,t.outcome);
      t.feesOpen=fc.feesOpen;t.feesClose=fc.feesClose;t.feesTotal=fc.feesTotal;
      t.pnlNet=+(t.pnl-t.feesTotal).toFixed(2);
    }
  });save();
}

function totalCapitalUSD(){
  const fx=state.settings.fxRates?.USDSGD||1.34;
  return state.settings.capital.filter(c=>c.enabled&&c.amount>0).reduce((s,c)=>s+(c.currency==='USD'?c.amount:c.amount/fx),0);
}

// ═══════════════════ TAB ═══════════════════
function switchTab(name){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(name).classList.add('active');
  document.getElementById('nav-'+name).classList.add('active');
  if(name==='dashboard')renderDashboard();
  if(name==='analytics')renderAnalytics();
  if(name==='log')renderLogForm();
  if(name==='history')renderHistory();
  if(name==='settings')renderSettings();
}

// ═══════════════════ DASHBOARD ═══════════════════
const C={grid:'rgba(128,128,160,0.12)',text:'#6a6a88',pos:'#5DCAA5',neg:'#F09595',blue:'#85B7EB',amber:'#EF9F27',purple:'#AFA9EC',teal:'#5DCAA5',coral:'#F0997B'};
let _charts={};
function dc(id){if(_charts[id]){_charts[id].destroy();delete _charts[id];}}

function renderDashboard(){
  const open=state.trades.filter(t=>t.status==='open');
  const closed=state.trades.filter(t=>t.status==='closed');
  const opts=closed.filter(t=>t.type!=='Stock Sale');
  const grossPnl=closed.reduce((s,t)=>s+(t.pnl||0),0);
  const totalFees=closed.reduce((s,t)=>s+(t.feesTotal||0),0);
  const wins=opts.filter(t=>(t.pnl||0)>0).length;
  const wr=opts.length?Math.round(wins/opts.length*100):0;
  const openCred=open.reduce((s,t)=>s+t.totalCredit,0);
  const targetAmt=state.settings.monthlyTarget||500;
  const targetMode=state.settings.monthlyTargetMode||'amount';
  // Current month net realized P&L
  const now=new Date();
  const curMonth=now.toISOString().slice(0,7);
  const thisMonthNet=closed
    .filter(t=>t.closedDate&&t.closedDate.slice(0,7)===curMonth)
    .reduce((s,t)=>s+(t.pnlNet!=null?t.pnlNet:netPnl(t)||0),0);
  const equityNow=totalCapitalUSD();
  const effectiveTarget=targetMode==='pct'?(equityNow>0?(equityNow*targetAmt/100):0):targetAmt;
  const targetPct=effectiveTarget>0?Math.max(0,(thisMonthNet/effectiveTarget)*100):0;  // can exceed 100
  const targetColor=targetPct>=100?C.pos:targetPct>=60?C.amber:C.blue;
  const monthLabel=now.toLocaleString('default',{month:'short',year:'2-digit'});
  const targetLabel=targetMode==='pct'?targetAmt+'% of equity ($'+effectiveTarget.toFixed(0)+')':'$'+effectiveTarget.toFixed(0);

  document.getElementById('hdr-sub').textContent=opts.length+' trades · '+open.length+' open';
  document.getElementById('hdr-badge').textContent=(grossPnl>=0?'+':'')+fmt(grossPnl,0);
  document.getElementById('hdr-badge').style.color=grossPnl>=0?'var(--pos)':'var(--neg)';

  // 4 metric cards
  document.getElementById('sum-cards').innerHTML=`
    <div class="metric">
      <div class="metric-label">Gross P&amp;L</div>
      <div class="metric-value ${grossPnl>=0?'pos':'neg'}">${fmtSgn(grossPnl,2)}</div>
      <div class="metric-sub neg">-$${totalFees.toFixed(2)} fees</div>
    </div>
    <div class="metric">
      <div class="metric-label">Win rate</div>
      <div class="metric-value">${wr}%</div>
      <div class="metric-sub">${wins}W ${opts.length-wins}L / ${opts.length}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Open premium</div>
      <div class="metric-value pos">${fmt(openCred,0)}</div>
      <div class="metric-sub">${open.length} position${open.length!==1?'s':''}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Monthly target</div>
      <div class="metric-value" style="font-size:17px;color:${targetColor}">${fmt(thisMonthNet,0)}</div>
      <div style="margin-top:5px">
        <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text3)">
          <span>${monthLabel}</span><span>${targetPct.toFixed(0)}% of ${targetLabel}</span>
        </div>
        <div class="target-bar-track"><div class="target-bar-fill" style="width:${targetPct.toFixed(1)}%;background:${targetColor}"></div></div>
      </div>
    </div>
  `;

  renderCapitalWidget(open);

  // Open positions with swipe-to-delete
  document.getElementById('dash-open').innerHTML=open.length
    ?open.map(t=>{
        const dl=t.expiry?calcDTE(t.expiry):'-';const warn=typeof dl==='number'&&dl<=7;
        return`<div class="swipe-wrap" id="sw-${t.id}">
          <button class="swipe-delete-btn" onclick="delTrade(${t.id})">Delete</button>
          <div class="swipe-content" id="swc-${t.id}" ontouchstart="swipeStart(event,${t.id})" ontouchmove="swipeMove(event,${t.id})" ontouchend="swipeEnd(event,${t.id})">
            <div style="flex:1">
              <div class="trade-ticker"><span class="badge ${badgeClass(t.type)}">${esc(t.type)}</span>${esc(t.ticker)}</div>
              <div class="trade-meta">Strike $${t.strike} · ${typeof dl==='number'?`<span class="${warn?'dte-warn':''}">${dl}d left</span>`:'-'} · ${t.contracts} contract${t.contracts>1?'s':''}</div>
              ${t.notes?`<div class="trade-note">${esc(t.notes)}</div>`:''}
            </div>
            <div style="text-align:right;flex-shrink:0;padding-left:10px">
              <div class="trade-pnl pos">+${fmt(t.totalCredit)}</div>
              <div style="margin-top:4px;display:flex;gap:6px;justify-content:flex-end">
                <button class="btn-sm" onclick="showEdit(${t.id})">Edit</button>
                <button class="btn-sm" onclick="showClose(${t.id})">Close</button>
              </div>
            </div>
          </div>
        </div>`;
      }).join('')
    :'<div class="empty">No open positions</div>';

  // Monthly net realized P&L bar chart
  // Group by closedDate month, sum pnlNet
  const mm={};
  closed.forEach(t=>{
    if(!t.closedDate)return;
    const mo=t.closedDate.slice(0,7);
    const v=t.pnlNet!=null?t.pnlNet:netPnl(t)||0;
    mm[mo]=(mm[mo]||0)+v;
  });
  const months=Object.keys(mm).sort();
  const mPnl=months.map(mo=>+mm[mo].toFixed(2));
  const _tgtRaw=state.settings.monthlyTarget||500;
  const _tgtMode=state.settings.monthlyTargetMode||'amount';
  const _equity=totalCapitalUSD();
  const tgt=_tgtMode==='pct'&&_equity>0?(_equity*_tgtRaw/100):_tgtRaw;
  dc('monthly-bar');
  if(months.length){
    _charts['monthly-bar']=new Chart(document.getElementById('c-monthly-bar'),{
      type:'bar',
      data:{
        labels:months.map(mo=>{const[y,m]=mo.split('-');return new Date(y,m-1).toLocaleString('default',{month:'short',year:'2-digit'});}),
        datasets:[
          {
            label:'Net P&L',data:mPnl,
            backgroundColor:mPnl.map(v=>v>=0?C.pos+'bb':C.neg+'bb'),
            borderColor:mPnl.map(v=>v>=0?C.pos:C.neg),
            borderWidth:1,borderRadius:4,
          },
          {
            label:'Target',data:months.map(()=>tgt),
            type:'line',borderColor:C.amber+'99',borderWidth:1.5,
            borderDash:[5,4],pointRadius:0,fill:false,tension:0,
          }
        ]
      },
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          tooltip:{callbacks:{label:ctx=>ctx.dataset.label+': $'+ctx.parsed.y.toFixed(2)}}
        },
        scales:{
          x:{ticks:{color:C.text,font:{size:10},autoSkip:false,maxRotation:45},grid:{display:false}},
          y:{ticks:{color:C.text,font:{size:10},callback:v=>'$'+v},grid:{color:C.grid}}
        }
      }
    });
  }

  // Cumulative gross P&L line
  const sc=[...closed].filter(t=>t.closedDate).sort((a,b)=>new Date(a.closedDate)-new Date(b.closedDate));
  let run=0;
  dc('pnl');
  if(sc.length){
    _charts['pnl']=new Chart(document.getElementById('c-pnl'),{
      type:'line',
      data:{
        labels:sc.map(t=>t.closedDate.slice(5)),
        datasets:[{
          label:'Cumulative',data:sc.map(t=>{run+=t.pnl||0;return+run.toFixed(2);}),
          borderColor:C.pos,backgroundColor:'transparent',pointRadius:2,
          pointBackgroundColor:C.pos,tension:.3,borderWidth:2
        }]
      },
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>'$'+ctx.parsed.y.toFixed(2)}}},scales:{x:{ticks:{color:C.text,font:{size:9},maxTicksLimit:10},grid:{color:C.grid}},y:{ticks:{color:C.text,font:{size:10},callback:v=>'$'+v},grid:{color:C.grid}}}}
    });
  }
}


function updateCapBalance(val){
  const c=state.settings.capital.find(x=>x.id==='usd');
  if(c){c.amount=val;c.enabled=val>0;}
  else{state.settings.capital.push({id:'usd',label:'USD Account',currency:'USD',amount:val,enabled:val>0});}
  save();renderCapitalWidget();
}

function renderCapitalWidget(openTrades){
  const open=openTrades||state.trades.filter(t=>t.status==='open');
  const equity=totalCapitalUSD();
  const cspOpen=open.filter(t=>['CSP','Diagonal','Bull Put'].includes(t.type));
  const ccOpen=open.filter(t=>['CC','PMCC'].includes(t.type));
  const cspNotional=cspOpen.reduce((s,t)=>s+t.strike*t.contracts*100,0);
  const ccNotional=ccOpen.reduce((s,t)=>s+t.strike*t.contracts*100,0);
  const notional=cspNotional+ccNotional;
  const free=equity>0?equity-notional:0;
  const util=equity>0?Math.min(100,(notional/equity)*100):0;
  const utilCol=util>80?'var(--neg)':util>60?'var(--warn)':'var(--blue)';

  if(equity===0){
    document.getElementById('capital-body').innerHTML=`<div style="font-size:12px;color:var(--text2);text-align:center;padding:6px 0">Set account balance in Settings to enable this widget</div>`;
    return;
  }

  // v4-style: 3 metric cards + utilbar
  document.getElementById('capital-body').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
      <div style="background:var(--bg3);border-radius:var(--radius);padding:10px 10px;border:0.5px solid var(--border)">
        <div style="font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Equity</div>
        <div style="font-size:15px;font-weight:700">$${equity.toLocaleString('en-US',{maximumFractionDigits:0})}</div>
      </div>
      <div style="background:var(--bg3);border-radius:var(--radius);padding:10px 10px;border:0.5px solid var(--border)">
        <div style="font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Collateral</div>
        <div style="font-size:15px;font-weight:700;color:var(--amber)">$${notional.toLocaleString('en-US',{maximumFractionDigits:0})}</div>
      </div>
      <div style="background:var(--bg3);border-radius:var(--radius);padding:10px 10px;border:0.5px solid var(--border)">
        <div style="font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Free</div>
        <div style="font-size:15px;font-weight:700;color:${free>=0?'var(--pos)':'var(--neg)'}">${free>=0?'$'+free.toLocaleString('en-US',{maximumFractionDigits:0}):'-$'+Math.abs(free).toLocaleString('en-US',{maximumFractionDigits:0})}</div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text2);margin-bottom:4px">
      <span>Capital deployed</span><span style="font-weight:700;color:${utilCol}">${util.toFixed(1)}%</span>
    </div>
    <div class="gauge-wrap"><div class="gauge-fill" style="width:${util.toFixed(1)}%;background:${utilCol}"></div></div>
  `;
}

// ═══════════════════ ANALYTICS ═══════════════════
function renderAnalytics(){
  const closed=state.trades.filter(t=>t.status==='closed');
  const open=state.trades.filter(t=>t.status==='open');
  const opts=closed.filter(t=>t.type!=='Stock Sale');
  const grossPnl=opts.reduce((s,t)=>s+(t.pnl||0),0);
  const totalCred=opts.reduce((s,t)=>s+t.totalCredit,0);
  const premEff=totalCred>0?((grossPnl/totalCred)*100).toFixed(1):0;
  const capRisk=opts.reduce((s,t)=>s+t.strike*t.contracts*100,0);
  const capEffTot=capRisk>0?((grossPnl/capRisk)*100).toFixed(2):0;
  const arocsV=opts.filter(t=>t.dte>0).map(t=>aroc(t)).filter(v=>v!==null);
  // Monthly ROC — net P&L / collateral for trades closed this calendar month
  const nowAna=new Date();
  const curMonAna=nowAna.toISOString().slice(0,7);
  const thisMonOpts=opts.filter(t=>t.closedDate&&t.closedDate.slice(0,7)===curMonAna);
  const thisMonNet=thisMonOpts.reduce((s,t)=>s+(t.pnlNet!=null?t.pnlNet:t.pnl||0),0);
  const thisMonCollat=thisMonOpts.reduce((s,t)=>s+t.strike*t.contracts*100,0);
  const monthlyROC=thisMonCollat>0?((thisMonNet/thisMonCollat)*100).toFixed(2):null;
  const avgAroc=arocsV.length?(arocsV.reduce((s,v)=>s+v,0)/arocsV.length).toFixed(1):0;
  const avgDTE=opts.length?Math.round(opts.reduce((s,t)=>s+t.dte,0)/opts.length):0;

  document.getElementById('ana-cards').innerHTML=`
    <div class="metric"><div class="metric-label">Prem efficiency</div><div class="metric-value">${premEff}%</div><div class="metric-sub">realized ÷ collected</div></div>
    <div class="metric"><div class="metric-label">Cap efficiency</div><div class="metric-value pos">${capEffTot}%</div><div class="metric-sub">P&amp;L ÷ collateral</div></div>
    <div class="metric"><div class="metric-label">Avg AROC</div><div class="metric-value pos">${avgAroc}%</div><div class="metric-sub">annualized</div></div>
    <div class="metric"><div class="metric-label">Avg DTE open</div><div class="metric-value">${avgDTE}d</div><div class="metric-sub">options only</div></div>
    <div class="metric"><div class="metric-label">Monthly ROC</div><div class="metric-value ${monthlyROC!=null&&monthlyROC>=0?'pos':'neg'}">${monthlyROC!=null?monthlyROC+'%':'—'}</div><div class="metric-sub">net P&amp;L ÷ collateral</div></div>
  `;

  const tickers=[...new Set(opts.map(t=>t.ticker))];
  const tC=[C.blue,C.teal,C.amber,C.coral,C.purple];
  document.getElementById('cap-rows').innerHTML=tickers.map((tk,i)=>{
    const tc=opts.filter(t=>t.ticker===tk);
    const pl=tc.reduce((s,t)=>s+(t.pnl||0),0);
    const cap=tc.reduce((s,t)=>s+t.strike*t.contracts*100,0);
    const ce=cap>0?((pl/cap)*100).toFixed(2):'-';
    const pe=tc.reduce((s,t)=>s+t.totalCredit,0);
    const peff=pe>0?((pl/pe)*100).toFixed(1):'-';
    const ar=tc.filter(t=>t.dte>0).map(t=>aroc(t)).filter(v=>v!==null);
    const avgA=ar.length?(ar.reduce((s,v)=>s+v,0)/ar.length).toFixed(1):'-';
    return`<div class="stat-row"><div style="font-size:14px;font-weight:700;color:${tC[i%5]}">${tk}</div>
      <div class="stat-nums">
        <div class="stat-num"><div class="stat-num-label">P&L/Collat</div><div class="stat-num-val ${parseFloat(ce)>=0?'pos':'neg'}">${ce}%</div></div>
        <div class="stat-num"><div class="stat-num-label">Prem eff</div><div class="stat-num-val">${peff}%</div></div>
        <div class="stat-num"><div class="stat-num-label">AROC</div><div class="stat-num-val pos">${avgA}%</div></div>
        ${(()=>{const tmo=tc.filter(t=>t.closedDate&&t.closedDate.slice(0,7)===new Date().toISOString().slice(0,7));const tmoNet=tmo.reduce((s,t)=>s+(t.pnlNet!=null?t.pnlNet:t.pnl||0),0);const tmoCol=tmo.reduce((s,t)=>s+t.strike*t.contracts*100,0);const mRoc=tmoCol>0?((tmoNet/tmoCol)*100).toFixed(2):null;return mRoc!=null?`<div class="stat-num"><div class="stat-num-label">Mo. ROC</div><div class="stat-num-val ${parseFloat(mRoc)>=0?'pos':'neg'}">${mRoc}%</div></div>`:'';})()}
      </div></div>`;
  }).join('')||'<div class="empty">No closed options data</div>';

  const tickerPnl=tickers.map(tk=>+closed.filter(t=>t.ticker===tk).reduce((s,t)=>s+(t.pnl||0),0).toFixed(2));
  document.getElementById('leg-ticker').innerHTML=tickers.map((tk,i)=>`<span><span class="legend-dot" style="background:${tC[i%5]}"></span>${tk}</span>`).join('');
  dc('ticker');
  if(tickers.length)_charts['ticker']=new Chart(document.getElementById('c-ticker'),{type:'bar',data:{labels:tickers,datasets:[{data:tickerPnl,backgroundColor:tickerPnl.map(v=>v>=0?C.pos+'99':C.neg+'99'),borderColor:tickerPnl.map(v=>v>=0?C.pos:C.neg),borderWidth:1,borderRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>'$'+ctx.parsed.y.toFixed(2)}}},scales:{x:{ticks:{color:C.text,font:{size:12}},grid:{display:false}},y:{ticks:{color:C.text,font:{size:10},callback:v=>'$'+v},grid:{color:C.grid}}}}});

  const allT=[...closed,...open];
  const typeCount={};allT.forEach(t=>typeCount[t.type]=(typeCount[t.type]||0)+1);
  const typeKeys=Object.keys(typeCount);const tcc=[C.blue,C.teal,C.amber,C.coral,C.purple,'#97C459'];
  document.getElementById('leg-strat').innerHTML=typeKeys.map((k,i)=>`<span><span class="legend-dot" style="background:${tcc[i%6]}"></span>${k} ${typeCount[k]}</span>`).join('');
  dc('strat');
  if(typeKeys.length)_charts['strat']=new Chart(document.getElementById('c-strat'),{type:'doughnut',data:{labels:typeKeys,datasets:[{data:typeKeys.map(k=>typeCount[k]),backgroundColor:tcc.slice(0,typeKeys.length),borderWidth:0,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.label+': '+ctx.parsed}}}}});

  const outcomes={};closed.forEach(t=>{if(t.outcome)outcomes[t.outcome]=(outcomes[t.outcome]||0)+1;});
  const outKeys=Object.keys(outcomes).filter(k=>outcomes[k]>0);
  const outColors=['#85B7EB','#5DCAA5','#F09595','#9090a8'];
  document.getElementById('leg-outcome').innerHTML=outKeys.map((k,i)=>`<span><span class="legend-dot" style="background:${outColors[i%4]}"></span>${k} ${outcomes[k]}</span>`).join('');
  dc('outcome');
  if(outKeys.length)_charts['outcome']=new Chart(document.getElementById('c-outcome'),{type:'doughnut',data:{labels:outKeys,datasets:[{data:outKeys.map(k=>outcomes[k]),backgroundColor:outColors.slice(0,outKeys.length),borderWidth:0,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.label+': '+ctx.parsed}}}}});
}

// ═══════════════════ LOG FORM ═══════════════════
const ALL_LOG_FIELDS={
  ticker:{label:'Ticker',required:true,type:'text',placeholder:'CRWV'},
  type:{label:'Strategy',required:true,type:'select',options:['CSP','CC','PMCC','Diagonal','Bull Put','Bear Call','Stock Sale']},
  openDate:{label:'Open date',required:true,type:'date'},
  expiry:{label:'Expiry',required:false,type:'date',hideFor:['Stock Sale']},
  strike:{label:'Strike',required:false,type:'number',placeholder:'77',step:'0.5'},
  premium:{label:'Premium/sh',required:false,type:'number',placeholder:'1.32',step:'0.01'},
  contracts:{label:'Contracts',required:false,type:'number',placeholder:'1',step:'1',default:'1'},
  underlying:{label:'Underlying',required:false,type:'number',placeholder:'80',step:'0.01',hideFor:['Stock Sale']},
  iv:{label:'IV%',required:false,type:'number',placeholder:'90',step:'0.1',hideFor:['Stock Sale']},
  delta:{label:'Delta',required:false,type:'number',placeholder:'-0.25',step:'0.01',hideFor:['Stock Sale']},
  dte:{label:'DTE',required:false,type:'number',readonly:true,hideFor:['Stock Sale']},
  maxProfit:{label:'Max profit',required:false,type:'number',readonly:true,hideFor:['Stock Sale']},
  notes:{label:'Notes',required:false,type:'text',placeholder:'e.g. Wheel leg 2'},
};
function renderLogForm(){
  const enabled=state.settings.logFields;const alwaysOn=['ticker','type','openDate'];
  const type=document.getElementById('lf-type')?.value||'CSP';
  const toShow=Object.keys(ALL_LOG_FIELDS).filter(k=>alwaysOn.includes(k)||enabled.includes(k));
  let html='';let pair=[];
  toShow.forEach((k,i)=>{
    const f=ALL_LOG_FIELDS[k];if(f.hideFor?.includes(type))return;
    let inp=f.type==='select'
      ?`<select id="lf-${k}" onchange="onTypeChange()">${f.options.map(o=>`<option value="${o}">${o}</option>`).join('')}</select>`
      :f.readonly?`<input type="number" id="lf-${k}" readonly>`
      :`<input type="${f.type}" id="lf-${k}" placeholder="${f.placeholder||''}" step="${f.step||''}" value="${f.default||''}">`;
    pair.push(`<div class="field" style="margin-bottom:0"><label>${f.label}${f.required?' *':''}</label>${inp}</div>`);
    if(pair.length===2||i===toShow.length-1){html+=pair.length===2?`<div class="form-2 form-field-wrap">${pair.join('')}</div>`:`<div class="form-field-wrap">${pair[0]}</div>`;pair=[];}
  });
  document.getElementById('log-form').innerHTML=html;
  const od=document.getElementById('lf-openDate');if(od&&!od.value)od.value=new Date().toISOString().slice(0,10);
  document.getElementById('lf-expiry')?.addEventListener('change',calcLogDTE);
  document.getElementById('lf-premium')?.addEventListener('input',calcLogDTE);
  document.getElementById('lf-contracts')?.addEventListener('input',calcLogDTE);
}
function onTypeChange(){renderLogForm();}
function calcLogDTE(){
  const exp=document.getElementById('lf-expiry')?.value;
  const open=document.getElementById('lf-openDate')?.value||new Date().toISOString().slice(0,10);
  const dteEl=document.getElementById('lf-dte');const mpEl=document.getElementById('lf-maxProfit');
  if(dteEl&&exp)dteEl.value=calcDTE(exp,open);
  if(mpEl){const p=parseFloat(document.getElementById('lf-premium')?.value)||0;const c=parseInt(document.getElementById('lf-contracts')?.value)||1;mpEl.value=(p*c*100).toFixed(2);}
}
function logTrade(){
  const ticker=(document.getElementById('lf-ticker')?.value||'').trim().toUpperCase();
  const type=document.getElementById('lf-type')?.value||'CSP';
  const openDate=document.getElementById('lf-openDate')?.value;
  if(!ticker||!openDate){toast('Ticker and open date required','err');return;}
  const expiry=type==='Stock Sale'?null:(document.getElementById('lf-expiry')?.value||null);
  const strike=parseFloat(document.getElementById('lf-strike')?.value)||0;
  const premium=parseFloat(document.getElementById('lf-premium')?.value)||0;
  const contracts=parseInt(document.getElementById('lf-contracts')?.value)||1;
  const dte=expiry?calcDTE(expiry,openDate):0;
  const trade={id:state.nextId++,ticker,type,openDate,expiry,strike,premium,contracts,
    underlying:parseFloat(document.getElementById('lf-underlying')?.value)||0,
    iv:parseFloat(document.getElementById('lf-iv')?.value)||0,
    delta:parseFloat(document.getElementById('lf-delta')?.value)||0,
    dte,notes:document.getElementById('lf-notes')?.value||'',
    totalCredit:type==='Stock Sale'?+(premium*contracts).toFixed(2):+(premium*contracts*100).toFixed(2),
    status:'open',closedDate:null,closeCost:0,outcome:null,pnl:null
  };
  const fc=calcFees(trade,null);
  trade.feesOpen=fc.feesOpen;trade.feesClose=0;trade.feesTotal=fc.feesOpen;trade.pnlNet=null;
  state.trades.unshift(trade);save();clearForm();toast(ticker+' '+type+' logged ✓');switchTab('history');
}
function clearForm(){
  document.querySelectorAll('#log-form input:not([readonly])').forEach(el=>el.value=el.dataset.default||'');
  const od=document.getElementById('lf-openDate');if(od)od.value=new Date().toISOString().slice(0,10);
  const ct=document.getElementById('lf-contracts');if(ct)ct.value='1';
}

// ═══════════════════ CLOSE & SWIPE ═══════════════════
const _swipe={};
function swipeStart(e,id){_swipe[id]={x:e.touches[0].clientX,open:false};}
function swipeMove(e,id){
  if(!_swipe[id])return;const dx=e.touches[0].clientX-_swipe[id].x;
  const content=document.getElementById('swc-'+id);const delBtn=document.getElementById('sw-'+id)?.querySelector('.swipe-delete-btn');
  if(!content||!delBtn)return;
  if(dx<0){const shift=Math.max(-72,dx);content.style.transform=`translateX(${shift}px)`;delBtn.style.transform=`translateX(${100+(shift/72)*100}%)`;}
  else if(_swipe[id].open){content.style.transform='translateX(0)';delBtn.style.transform='translateX(100%)';}
}
function swipeEnd(e,id){
  if(!_swipe[id])return;const dx=e.changedTouches[0].clientX-_swipe[id].x;
  const content=document.getElementById('swc-'+id);const delBtn=document.getElementById('sw-'+id)?.querySelector('.swipe-delete-btn');
  if(!content||!delBtn)return;
  if(dx<-40){content.style.transform='translateX(-72px)';delBtn.style.transform='translateX(0)';_swipe[id].open=true;}
  else{content.style.transform='translateX(0)';delBtn.style.transform='translateX(100%)';_swipe[id].open=false;}
}
function showClose(id){document.getElementById('cm-id').value=id;document.getElementById('cm-date').value=new Date().toISOString().slice(0,10);document.getElementById('cm-cost').value=0;document.getElementById('close-modal').classList.add('show');}
function hideModal(id){document.getElementById(id||'close-modal').classList.remove('show');}
function confirmClose(){
  const id=parseInt(document.getElementById('cm-id').value);const t=state.trades.find(x=>x.id===id);if(!t)return;
  const cc=parseFloat(document.getElementById('cm-cost').value)||0;
  t.status='closed';t.closedDate=document.getElementById('cm-date').value;t.outcome=document.getElementById('cm-outcome').value;t.closeCost=cc;
  t.pnl=+(t.totalCredit-(cc*t.contracts*100)).toFixed(2);
  const fc=calcFees(t,t.outcome);t.feesOpen=t.feesOpen||fc.feesOpen;t.feesClose=fc.feesClose;t.feesTotal=(t.feesOpen||0)+fc.feesClose;t.pnlNet=+(t.pnl-t.feesTotal).toFixed(2);
  save();hideModal('close-modal');toast(t.ticker+' closed · '+(t.pnl>=0?'+':'')+fmt(t.pnl));renderDashboard();
}
function delTrade(id){if(!confirm('Delete this trade?'))return;state.trades=state.trades.filter(x=>x.id!==id);save();toast('Deleted','warn');renderDashboard();}
function showEdit(id){
  const t=state.trades.find(x=>x.id===id);if(!t)return;
  document.getElementById('em-id').value=id;
  document.getElementById('em-ticker').value=t.ticker||'';
  document.getElementById('em-type').value=t.type||'CSP';
  document.getElementById('em-openDate').value=t.openDate||'';
  document.getElementById('em-expiry').value=t.expiry||'';
  document.getElementById('em-strike').value=t.strike||'';
  document.getElementById('em-premium').value=t.premium||'';
  document.getElementById('em-contracts').value=t.contracts||1;
  document.getElementById('em-iv').value=t.iv||'';
  document.getElementById('em-delta').value=t.delta||'';
  document.getElementById('em-notes').value=t.notes||'';
  // Fee fields for closed trades
  const feeSection=document.getElementById('em-fee-section');
  if(feeSection){
    if(t.status==='closed'){
      feeSection.style.display='block';
      document.getElementById('em-feesOpen').value=(t.feesOpen||0).toFixed(4);
      document.getElementById('em-feesClose').value=(t.feesClose||0).toFixed(4);
    } else {
      feeSection.style.display='none';
    }
  }
  document.getElementById('edit-modal').classList.add('show');
}
function confirmEdit(){
  const id=parseInt(document.getElementById('em-id').value);
  const t=state.trades.find(x=>x.id===id);if(!t)return;
  t.ticker=(document.getElementById('em-ticker').value||'').trim().toUpperCase();
  t.type=document.getElementById('em-type').value;
  t.openDate=document.getElementById('em-openDate').value;
  t.expiry=document.getElementById('em-expiry').value||null;
  t.strike=parseFloat(document.getElementById('em-strike').value)||0;
  t.premium=parseFloat(document.getElementById('em-premium').value)||0;
  t.contracts=parseInt(document.getElementById('em-contracts').value)||1;
  t.iv=parseFloat(document.getElementById('em-iv').value)||0;
  t.delta=parseFloat(document.getElementById('em-delta').value)||0;
  t.notes=document.getElementById('em-notes').value||'';
  // Recalc totalCredit
  if(t.status==='open'){
    t.totalCredit=t.type==='Stock Sale'?+(t.premium*t.contracts).toFixed(2):+(t.premium*t.contracts*100).toFixed(2);
  }
  // For closed trades: use manually entered fees if fee section visible
  if(t.status==='closed'&&t.pnl!=null){
    const foEl=document.getElementById('em-feesOpen');
    const fcEl=document.getElementById('em-feesClose');
    if(foEl&&document.getElementById('em-fee-section')?.style.display!=='none'){
      t.feesOpen=parseFloat(foEl.value)||0;
      t.feesClose=parseFloat(fcEl.value)||0;
      t.feesTotal=+(t.feesOpen+t.feesClose).toFixed(4);
    } else {
      const fc=calcFees(t,t.outcome);
      t.feesOpen=fc.feesOpen;t.feesClose=fc.feesClose;t.feesTotal=fc.feesTotal;
    }
    t.pnlNet=+(t.pnl-t.feesTotal).toFixed(2);
  }
  save();
  hideModal('edit-modal');
  toast(t.ticker+' updated ✓');
  // Re-render whichever tab is active
  const active=document.querySelector('.panel.active')?.id;
  if(active==='dashboard')renderDashboard();
  if(active==='history')renderHistory();
}


// ═══════════════════ HISTORY ═══════════════════
let histFilters={ticker:'',type:'',outcome:'',dateFrom:'',dateTo:'',period:'all'};

function setHistPeriodChip(_,v){setHistPeriod(v);}
function setHistTickerChip(_,v){histFilters.ticker=v;renderHistory();}
function setHistTypeChip(_,v){histFilters.type=v;renderHistory();}
function setHistOutcomeChip(_,v){histFilters.outcome=v;renderHistory();}

function setHistPeriod(v){
  const now=new Date();
  histFilters.period=v;
  if(v==='thismonth'){
    histFilters.dateFrom=now.toISOString().slice(0,7)+'-01';
    histFilters.dateTo=new Date(now.getFullYear(),now.getMonth()+1,0).toISOString().slice(0,10);
  }else if(v==='lastmonth'){
    const d=new Date(now.getFullYear(),now.getMonth()-1,1);
    histFilters.dateFrom=d.toISOString().slice(0,10);
    histFilters.dateTo=new Date(now.getFullYear(),now.getMonth(),0).toISOString().slice(0,10);
  }else if(v==='thisyear'){
    histFilters.dateFrom=now.getFullYear()+'-01-01';
    histFilters.dateTo=now.getFullYear()+'-12-31';
  }else if(v==='all'){
    histFilters.dateFrom='';histFilters.dateTo='';
  }else if(v==='custom'){
    histFilters.dateFrom='';histFilters.dateTo='';
  }
  renderHistory();
}

function renderHistory(){
  const tickers=[...new Set(state.trades.map(t=>t.ticker))];
  // History filter — minimal segmented tabs per row
  const seg=(opts,cur,fn)=>`<div style="display:flex;background:var(--bg3);border-radius:22px;padding:3px;gap:0">`+
    opts.map(([v,l])=>`<button onclick="${fn}(this,'${v}')" style="flex:1;padding:5px 0;font-size:12px;font-weight:${cur===v?700:500};border:none;border-radius:19px;cursor:pointer;background:${cur===v?'var(--blue)':'transparent'};color:${cur===v?'#051629':'var(--text2)'};transition:all .15s;white-space:nowrap;min-width:0;overflow:hidden;text-overflow:ellipsis">${l}</button>`).join('')+
    `</div>`;

  const periodOpts=[['all','All'],['thismonth','This mo.'],['lastmonth','Last mo.'],['thisyear','This yr'],['custom','Custom']];
  const tickerOpts=[['','All'],...tickers.map(t=>[t,t])];
  const typeOpts=[['','All'],['CSP','CSP'],['CC','CC'],['Diagonal','Diag'],['Stock Sale','Stock']];
  const outcomeOpts=[['','All'],['Open','Open'],['Expired','Exp.'],['Closed','Closed'],['Assigned','Asgnd'],['Sold','Sold']];

  const filterLabel=t=>`<div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">${t}</div>`;

  document.getElementById('hist-filters').innerHTML=
    `<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:4px">` +
    `<div>${filterLabel('Period')}${seg(periodOpts,histFilters.period||'all','setHistPeriodChip')}</div>` +
    (histFilters.period==='custom'?`<div style="display:flex;gap:6px">
      <input type="date" value="${histFilters.dateFrom}" onchange="histFilters.dateFrom=this.value;renderHistory()" style="flex:1;font-size:13px;padding:6px 8px">
      <input type="date" value="${histFilters.dateTo}" onchange="histFilters.dateTo=this.value;renderHistory()" style="flex:1;font-size:13px;padding:6px 8px">
    </div>`:'') +
    `<div>${filterLabel('Ticker')}${seg(tickerOpts,histFilters.ticker,'setHistTickerChip')}</div>` +
    `<div>${filterLabel('Type')}${seg(typeOpts,histFilters.type,'setHistTypeChip')}</div>` +
    `<div>${filterLabel('Result')}${seg(outcomeOpts,histFilters.outcome,'setHistOutcomeChip')}</div>` +
    `</div>`;

  let trades=[...state.trades];
  if(histFilters.ticker)trades=trades.filter(t=>t.ticker===histFilters.ticker);
  if(histFilters.type)trades=trades.filter(t=>t.type===histFilters.type);
  if(histFilters.outcome==='Open')trades=trades.filter(t=>t.status==='open');
  else if(histFilters.outcome)trades=trades.filter(t=>t.outcome===histFilters.outcome);
  if(histFilters.dateFrom)trades=trades.filter(t=>(t.openDate||'')>=histFilters.dateFrom);
  if(histFilters.dateTo)trades=trades.filter(t=>(t.openDate||'')<=histFilters.dateTo);
  const totalPnl=trades.filter(t=>t.status==='closed').reduce((s,t)=>s+(t.pnl||0),0);
  document.getElementById('hist-pnl-bar').innerHTML=`<div style="font-size:11px;color:var(--text2)">${trades.length} trades · filtered gross P&amp;L</div><div style="font-size:17px;font-weight:700" class="${totalPnl>=0?'pos':'neg'}">${fmtSgn(totalPnl)}</div>`;
  const cols=state.settings.histCols.filter(c=>c.on);
  const el=document.getElementById('hist-list');
  if(!trades.length){el.innerHTML='<div class="empty">No trades match filters</div>';return;}
  el.innerHTML='<div class="card">'+trades.map(t=>{
    const isOpen=t.status==='open';const ce=capEff(t);const a=aroc(t);
    const pp=t.totalCredit>0&&t.pnl!=null?((t.pnl/t.totalCredit)*100).toFixed(1):null;
    return`<div class="trade-row">
      <div style="flex:1">
        <div class="trade-ticker"><span class="badge ${badgeClass(t.type)}">${esc(t.type)}</span><span style="font-weight:700">${esc(t.ticker)}</span> <span style="font-size:11px;font-weight:400;color:var(--text2)">$${t.strike}</span></div>
        <div class="trade-meta">${t.openDate}${t.closedDate?' → '+t.closedDate:''} · ${t.dte}d${t.iv?' · IV '+t.iv+'%':''}</div>
        <div class="trade-meta">${[
          ce!=null?'Cap: '+ce.toFixed(2)+'%':null,
          a!=null?'AROC: '+a.toFixed(1)+'%':null,
          t.feesTotal?'-$'+t.feesTotal.toFixed(2)+' fees':null,
        ].filter(Boolean).join(' · ')}</div>
        ${t.notes&&cols.find(c=>c.key==='notes')?`<div class="trade-note">${esc(t.notes)}</div>`:''}
      </div>
      <div style="text-align:right;flex-shrink:0;padding-left:8px">
        <div class="trade-pnl ${isOpen?'pos':t.pnl>=0?'pos':'neg'}">${isOpen?'+'+fmt(t.totalCredit):fmtSgn(t.pnl||0)}</div>
        ${!isOpen&&t.pnlNet!=null?`<div style="font-size:11px;color:var(--text2)">net ${fmtSgn(t.pnlNet)}</div>`:''}
        <div style="font-size:11px;margin-top:3px"><span class="badge ${isOpen?'b-open':outcomeClass(t.outcome)}">${isOpen?'Open':t.outcome}</span>${pp!=null?' '+pp+'%':''}</div>
        <div style="display:flex;gap:5px;margin-top:5px;justify-content:flex-end"><button class="btn-sm" onclick="showEdit(${t.id})">Edit</button>${isOpen?`<button class="btn-sm" onclick="showClose(${t.id})">Close</button>`:''}<button class="btn-sm btn-del" onclick="delTrade(${t.id})">Del</button></div>
      </div></div>`;
  }).join('')+'</div>';
}

// ═══════════════════ SETTINGS ═══════════════════
function renderSettings(){renderSettingsMain();}
function renderSettingsMain(){
  const f=state.settings.fees||{};
  const pKey=f.preset||'tiger-ultra';
  const pName=(PRESETS[pKey]||{name:'Custom'}).name;
  const th=state.settings.theme||'dark';
  const caps=state.settings.capital.filter(c=>c.enabled&&c.amount>0);
  const capSub=caps.length?caps.map(c=>(c.currency==='USD'?'$':'S$')+c.amount.toLocaleString('en-US',{maximumFractionDigits:0})).join(' + '):'Not set';
  const fCount=state.settings.logFields.length;
  const cCount=state.settings.histCols.filter(c=>c.on).length;
  const tgt=state.settings.monthlyTarget||500;
  document.getElementById('s-main-view').innerHTML=`
  <p class="s-section-label">General</p>
  <div class="s-group">
    <div class="s-row" onclick="openSettingsSub('appearance')">
      <div class="s-row-l"><div class="s-icon" style="background:rgba(133,183,235,0.12)"><svg viewBox="0 0 24 24" fill="none" stroke="#85B7EB" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg></div>
      <div><div class="s-rtitle">Appearance</div><div class="s-rsub">${th==='dark'?'Dark':'Light'} theme</div></div></div>
      <div class="s-row-r"><span class="s-chev">›</span></div>
    </div>
    <div class="s-row" onclick="openSettingsSub('target')">
      <div class="s-row-l"><div class="s-icon" style="background:rgba(93,202,165,0.12)"><svg viewBox="0 0 24 24" fill="none" stroke="#5DCAA5" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div>
      <div><div class="s-rtitle">Monthly target</div><div class="s-rsub">${(state.settings.monthlyTargetMode||'amount')==='pct'?tgt+'% of equity':'$'+tgt.toLocaleString('en-US',{maximumFractionDigits:0})+'/month'}</div></div></div>
      <div class="s-row-r"><span class="s-chev">›</span></div>
    </div>
  </div>
  <p class="s-section-label">Account</p>
  <div class="s-group">
    <div class="s-row" onclick="openSettingsSub('account')">
      <div class="s-row-l"><div class="s-icon" style="background:rgba(239,159,39,0.12)"><svg viewBox="0 0 24 24" fill="none" stroke="#EF9F27" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div>
      <div><div class="s-rtitle">Capital</div><div class="s-rsub">${capSub}</div></div></div>
      <div class="s-row-r"><span class="s-chev">›</span></div>
    </div>
  </div>
  <p class="s-section-label">Commissions</p>
  <div class="s-group">
    <div class="s-row" onclick="openSettingsSub('fees')">
      <div class="s-row-l"><div class="s-icon" style="background:rgba(240,149,149,0.1)"><svg viewBox="0 0 24 24" fill="none" stroke="#F09595" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></div>
      <div><div class="s-rtitle">Fee plan</div><div class="s-rsub">${pName} · GST ${f.gst!==false?(f.gstRate||9)+'%':'off'}</div></div></div>
      <div class="s-row-r"><span class="s-chip ${pKey==='free'?'chip-green':'chip-red'}">${pKey==='free'?'Free':'Active'}</span><span class="s-chev">›</span></div>
    </div>
  </div>
  <p class="s-section-label">Log &amp; history</p>
  <div class="s-group">
    <div class="s-row" onclick="openSettingsSub('logfields')">
      <div class="s-row-l"><div class="s-icon" style="background:rgba(93,202,165,0.12)"><svg viewBox="0 0 24 24" fill="none" stroke="#5DCAA5" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>
      <div><div class="s-rtitle">Log form fields</div><div class="s-rsub">${fCount} optional fields</div></div></div>
      <div class="s-row-r"><span class="s-chev">›</span></div>
    </div>
    <div class="s-row" onclick="openSettingsSub('histcols')">
      <div class="s-row-l"><div class="s-icon" style="background:rgba(93,202,165,0.12)"><svg viewBox="0 0 24 24" fill="none" stroke="#5DCAA5" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></div>
      <div><div class="s-rtitle">History columns</div><div class="s-rsub">${cCount} visible</div></div></div>
      <div class="s-row-r"><span class="s-chev">›</span></div>
    </div>
  </div>
  <p class="s-section-label">Data</p>
  <div class="s-group">
    <div class="s-row" onclick="openSettingsSub('data')">
      <div class="s-row-l"><div class="s-icon" style="background:rgba(133,183,235,0.12)"><svg viewBox="0 0 24 24" fill="none" stroke="#85B7EB" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg></div>
      <div><div class="s-rtitle">Export, import &amp; backup</div><div class="s-rsub">${state.trades.length} trades stored</div></div></div>
      <div class="s-row-r"><span class="s-chev">›</span></div>
    </div>
  </div>`;
  document.getElementById('s-sub-view').style.display='none';
  document.getElementById('s-main-view').style.display='block';
}

const S_BACK='<div class="sub-back" onclick="closeSettingsSub()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width:18px;height:18px;stroke-width:2.5"><polyline points="15 18 9 12 15 6"/></svg>Settings</div>';
function openSettingsSub(id){document.getElementById('s-main-view').style.display='none';const sub=document.getElementById('s-sub-view');sub.style.display='block';renderSettingsSub(id,sub);}
function closeSettingsSub(){document.getElementById('s-sub-view').style.display='none';document.getElementById('s-main-view').style.display='block';renderSettingsMain();}

function renderSettingsSub(id,el){
  if(id==='appearance'){
    const th=state.settings.theme||'dark';
    el.innerHTML=S_BACK+`<div class="sub-title">Appearance</div><div class="sub-desc">Choose your preferred theme.</div>
    <div class="s-group"><div class="s-row" style="cursor:default"><div class="s-row-l"><div class="s-rtitle">Theme</div></div>
      <div class="segment" style="margin:0;width:160px">
        <button class="seg-btn ${th==='light'?'active':''}" onclick="setTheme('light');renderSettingsSub('appearance',document.getElementById('s-sub-view'))">Light</button>
        <button class="seg-btn ${th==='dark'?'active':''}" onclick="setTheme('dark');renderSettingsSub('appearance',document.getElementById('s-sub-view'))">Dark</button>
      </div></div></div>`;

  }else if(id==='target'){
    const tgt=state.settings.monthlyTarget||500;
    const mode=state.settings.monthlyTargetMode||'amount';
    const equity=totalCapitalUSD();
    const effTgt=mode==='pct'&&equity>0?(equity*tgt/100):tgt;
    const amtSel=mode==='amount'?'background:var(--blue);color:#051629;font-weight:700':'background:none;color:var(--text2)';
    const pctSel=mode==='pct'?'background:var(--pos);color:#051a0f;font-weight:700':'background:none;color:var(--text2)';
    const presets=mode==='pct'
      ?[0.5,1,1.5,2,3,5].map(v=>`<button class="btn-sm" style="width:100%;padding:10px 8px;font-size:13px;${tgt===v?'border-color:var(--blue);color:var(--blue);background:rgba(133,183,235,0.08)':''}" onclick="state.settings.monthlyTarget=${v};save();renderSettingsSub('target',document.getElementById('s-sub-view'))">${v}%</button>`).join('')
      :[300,500,800,1000,1500,2000].map(v=>`<button class="btn-sm" style="width:100%;padding:10px 8px;font-size:13px;${tgt===v?'border-color:var(--blue);color:var(--blue);background:rgba(133,183,235,0.08)':''}" onclick="state.settings.monthlyTarget=${v};save();renderSettingsSub('target',document.getElementById('s-sub-view'))">$${v}</button>`).join('');
    el.innerHTML=S_BACK+`<div class="sub-title">Monthly target</div>
    <div class="sub-desc">Net realized P&L goal per month. Fixed amount or % of equity — your choice.</div>
    <div class="s-group"><div style="padding:14px 16px">
      <div style="margin-bottom:14px">
        <div style="font-size:11px;color:var(--text2);font-weight:600;letter-spacing:.03em;text-transform:uppercase;margin-bottom:8px">Target mode</div>
        <div style="display:flex;background:var(--bg3);border-radius:var(--radius);padding:3px">
          <button style="flex:1;padding:8px 4px;font-size:13px;font-weight:600;border:none;border-radius:8px;cursor:pointer;${amtSel}" onclick="state.settings.monthlyTargetMode='amount';save();renderSettingsSub('target',document.getElementById('s-sub-view'))">Fixed $</button>
          <button style="flex:1;padding:8px 4px;font-size:13px;font-weight:600;border:none;border-radius:8px;cursor:pointer;${pctSel}" onclick="state.settings.monthlyTargetMode='pct';save();renderSettingsSub('target',document.getElementById('s-sub-view'))">% of equity</button>
        </div>
      </div>
      <div class="field">
        <label>${mode==='pct'?'Target (% of equity)':'Target (USD per month)'}</label>
        <input type="number" id="tgt-input" value="${tgt}" step="${mode==='pct'?'0.1':'50'}" min="0" placeholder="${mode==='pct'?'1.5':'500'}">
      </div>
      ${mode==='pct'&&equity>0?`<div style="font-size:12px;color:var(--text2);margin-bottom:10px">= $${effTgt.toFixed(0)}/month at current equity $${equity.toLocaleString('en-US',{maximumFractionDigits:0})}</div>`:''}
      <button class="btn btn-blue" onclick="state.settings.monthlyTarget=parseFloat(document.getElementById('tgt-input').value)||500;save();toast('Target saved');closeSettingsSub()">Save target</button>
    </div></div>
    <div class="s-group"><div style="padding:12px 16px">
      <div style="font-size:12px;color:var(--text2);font-weight:600;margin-bottom:10px">Quick presets</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${presets}</div>
    </div></div>`;
    }else if(id==='account'){
    const udsCap=state.settings.capital.find(c=>c.id==='usd')||state.settings.capital[0];
    el.innerHTML=S_BACK+`<div class="sub-title">Capital</div>
    <div class="sub-desc">Set your USD account balance. Used to calculate capital utilisation on the dashboard.</div>
    <div class="s-group"><div style="padding:20px 16px 16px">
      <div class="field" style="margin-bottom:0">
        <label>Account balance (USD)</label>
        <input type="number" id="cap-usd-input" value="${udsCap?udsCap.amount||'':''}" placeholder="e.g. 37466" step="100"
          oninput="updateCapBalance(parseFloat(this.value)||0)">
      </div>
    </div></div>`;
  }else if(id==='fees'){
    renderFeeSubScreen(el);
  }else if(id==='logfields'){
    const alwaysOn=['ticker','type','openDate'];
    const allKeys=Object.keys(ALL_LOG_FIELDS).filter(k=>!alwaysOn.includes(k));
    el.innerHTML=S_BACK+`<div class="sub-title">Log form fields</div><div class="sub-desc">Toggle optional fields. Ticker, Strategy and Open date always show.</div>
    <div class="s-group">${allKeys.map(k=>{const on=state.settings.logFields.includes(k);const lf=ALL_LOG_FIELDS[k];
      return`<div class="s-row" style="cursor:default"><div class="s-row-l"><div class="s-rtitle">${lf.label}</div></div>
        <label class="toggle" onclick="event.stopPropagation()"><input type="checkbox" ${on?'checked':''} onchange="toggleLogField('${k}',this.checked)"><div class="toggle-track"></div><div class="toggle-thumb"></div></label></div>`;
    }).join('')}</div>`;
  }else if(id==='histcols'){
    el.innerHTML=S_BACK+`<div class="sub-title">History columns</div><div class="sub-desc">Toggle visibility. Drag ⠿ to reorder.</div>
    <div class="s-group" style="padding:4px 16px">${state.settings.histCols.map((col,i)=>`
      <div class="drag-item" draggable="true" data-i="${i}" ondragstart="dragStart(event)" ondragover="dragOver(event)" ondrop="dropCol(event)">
        <span class="drag-handle">⠿</span><span class="drag-label">${col.label}</span>
        <label class="toggle" onclick="event.stopPropagation()"><input type="checkbox" ${col.on?'checked':''} onchange="state.settings.histCols[${i}].on=this.checked;save()"><div class="toggle-track"></div><div class="toggle-thumb"></div></label>
      </div>`).join('')}</div>`;
  }else if(id==='data'){
    const stored=localStorage.getItem(SK)||'';
    el.innerHTML=S_BACK+`<div class="sub-title">Data &amp; backup</div><div class="sub-desc">Trades saved on-device. Export CSV as backup.</div>
    <div class="s-group">
      <div class="s-row" onclick="exportCSV()"><div class="s-row-l"><div class="s-icon" style="background:rgba(93,202,165,0.12)"><svg viewBox="0 0 24 24" fill="none" stroke="#5DCAA5" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div>
      <div><div class="s-rtitle">Export trades</div><div class="s-rsub">${state.trades.length} trades · ${(stored.length/1024).toFixed(1)} KB</div></div></div><div class="s-row-r"><span class="s-chip chip-green">CSV</span><span class="s-chev">›</span></div></div>
      <div class="s-row" onclick="downloadTemplate()"><div class="s-row-l"><div class="s-icon" style="background:rgba(133,183,235,0.12)"><svg viewBox="0 0 24 24" fill="none" stroke="#85B7EB" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
      <div><div class="s-rtitle">Download template</div></div></div><div class="s-row-r"><span class="s-chev">›</span></div></div>
    </div>
    <div class="s-group"><div style="padding:14px 16px">
      <div class="field"><label>Import mode</label><select id="import-mode"><option value="merge">Merge — add new trades</option><option value="replace">Replace — overwrite all</option></select></div>
      <input type="file" id="import-file" accept=".csv" style="display:none" onchange="handleImport(event)">
      <button class="btn btn-amber" onclick="document.getElementById('import-file').click()">Import from CSV</button>
    </div></div>
    <div class="s-group"><div class="s-row" onclick="confirmClearAll()">
      <div class="s-row-l"><div class="s-icon" style="background:rgba(240,149,149,0.08)"><svg viewBox="0 0 24 24" fill="none" stroke="#F09595" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></div>
      <div><div class="s-rtitle" style="color:var(--neg)">Clear all data</div></div></div>
      <div class="s-row-r"><span class="s-chev" style="color:var(--neg)">›</span></div>
    </div></div>`;
  }
}

function renderFeeSubScreen(el){
  const f=state.settings.fees||{};const pKey=f.preset||'tiger-ultra';
  el.innerHTML=S_BACK+`<div class="sub-title">Commissions &amp; fees</div><div class="sub-desc">Select your broker preset. Fees auto-apply on every trade.</div>
  <p class="s-section-label">Broker preset</p>
  <div class="preset-grid">${Object.entries(PRESETS).map(([k,p])=>`<div class="preset-pill ${pKey===k?'on':''}" onclick="selectFeePreset('${k}')"><div class="preset-pill-name">${p.name}</div><div class="preset-pill-sub">${p.sub}</div></div>`).join('')}</div>
  ${pKey==='custom'?`<p class="s-section-label">Custom rates</p><div class="s-group"><div style="padding:14px 16px">
    <div class="form-2" style="gap:10px;margin-bottom:10px"><div class="field" style="margin-bottom:0"><label>Commission/contract ($)</label><input type="number" value="${f.commissionRate||0}" step="0.01" oninput="f.commissionRate=parseFloat(this.value)||0;save()"></div>
    <div class="field" style="margin-bottom:0"><label>Platform/contract ($)</label><input type="number" value="${f.platformRate||0}" step="0.01" oninput="f.platformRate=parseFloat(this.value)||0;save()"></div></div>
    <div class="form-2" style="gap:10px;margin-bottom:10px"><div class="field" style="margin-bottom:0"><label>Min commission ($)</label><input type="number" value="${f.minOrderFee||0}" step="0.01" oninput="f.minOrderFee=parseFloat(this.value)||0;save()"></div>
    <div class="field" style="margin-bottom:0"><label>Min platform fee ($)</label><input type="number" value="${f.minPlatformFee||0}" step="0.01" oninput="f.minPlatformFee=parseFloat(this.value)||0;save()"></div></div>
  </div></div>`:''}
  <p class="s-section-label">Pass-through fees</p>
  <div class="s-group"><div class="s-row" style="cursor:default"><div class="s-row-l"><div><div class="s-rtitle">Include ORF · OCC · FINRA TAF</div></div></div>
    <label class="toggle" onclick="event.stopPropagation()"><input type="checkbox" ${f.includePassThrough!==false?'checked':''} onchange="f.includePassThrough=this.checked;save()"><div class="toggle-track"></div><div class="toggle-thumb"></div></label>
  </div><div style="padding:0 16px 14px"><div class="form-3" style="gap:8px">
    <div class="field" style="margin-bottom:0"><label>ORF/contract</label><input type="number" value="${f.orf||0.012}" step="0.001" oninput="f.orf=parseFloat(this.value)||0;save()"></div>
    <div class="field" style="margin-bottom:0"><label>OCC/contract</label><input type="number" value="${f.occ||0.025}" step="0.001" oninput="f.occ=parseFloat(this.value)||0;save()"></div>
    <div class="field" style="margin-bottom:0"><label>FINRA TAF</label><input type="number" value="${f.finraTaf||0.00329}" step="0.0001" oninput="f.finraTaf=parseFloat(this.value)||0;save()"></div>
  </div></div></div>
  <p class="s-section-label">Singapore GST</p>
  <div class="s-group"><div class="s-row" style="cursor:default"><div class="s-row-l"><div><div class="s-rtitle">Apply GST on all fees</div><div class="s-rsub">9% from 1 Jan 2024 · SG residents</div></div></div>
    <label class="toggle" onclick="event.stopPropagation()"><input type="checkbox" ${f.gst!==false?'checked':''} onchange="f.gst=this.checked;save()"><div class="toggle-track"></div><div class="toggle-thumb"></div></label>
  </div><div style="padding:0 16px 14px"><div class="field" style="margin-bottom:0"><label>GST rate (%)</label>
    <input type="number" value="${f.gstRate||9}" step="0.1" min="0" oninput="f.gstRate=parseFloat(this.value)||9;save()">
  </div></div></div>
  <div class="s-group" style="margin-top:8px"><div style="padding:12px 16px">
    <div style="font-size:12px;color:var(--text2);margin-bottom:10px;line-height:1.5">Fee changes apply to <strong style="color:var(--text)">new trades only</strong> by default.</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="btn btn-ghost" style="text-align:left;padding:11px 14px;font-size:13px;font-weight:600" onclick="recomputeFees(\'open\')">↻ Open trades only</button>
      <button class="btn btn-ghost" style="text-align:left;padding:11px 14px;font-size:13px;font-weight:600" onclick="recomputeFees(\'all\')">↻ All trades (open + closed)</button>
      <button class="btn btn-ghost" style="text-align:left;padding:11px 14px;font-size:13px;font-weight:600" onclick="showManualFeeEdit()">✎ Edit individual trade fees</button>
    </div>
  </div></div>`;
}

function selectFeePreset(key){
  const f=state.settings.fees;f.preset=key;
  const p=PRESETS[key];if(p)Object.assign(f,{commissionRate:p.commissionRate,platformRate:p.platformRate,minOrderFee:p.minOrderFee,minPlatformFee:p.minPlatformFee,includePassThrough:p.includePassThrough,model:p.model,stockRate:p.stockRate});
  save();renderFeeSubScreen(document.getElementById('s-sub-view'));toast('Preset saved · applies to new trades');
}
function toggleLogField(key,on){const f=state.settings.logFields;if(on&&!f.includes(key))f.push(key);else if(!on)state.settings.logFields=f.filter(k=>k!==key);save();}
let _dragIdx=null;
function dragStart(e){_dragIdx=parseInt(e.currentTarget.dataset.i);}
function dragOver(e){e.preventDefault();}
function dropCol(e){
  e.preventDefault();const to=parseInt(e.currentTarget.dataset.i);
  if(_dragIdx===null||_dragIdx===to)return;
  const cols=state.settings.histCols;const moved=cols.splice(_dragIdx,1)[0];cols.splice(to,0,moved);_dragIdx=null;
  save();renderSettingsSub('histcols',document.getElementById('s-sub-view'));
}
function confirmClearAll(){if(!confirm('Delete ALL trades and reset? Cannot be undone.'))return;localStorage.removeItem(SK);state.trades=[];state.nextId=1;save();toast('All data cleared','warn');renderDashboard();renderSettingsSub('data',document.getElementById('s-sub-view'));}

// ═══════════════════ CSV ═══════════════════
function exportCSV(){
  const rows=[CSV_FIELDS.join(',')];
  state.trades.forEach(t=>{const row=CSV_FIELDS.map(h=>{const v=t[h]==null?'':t[h];const s=String(v);return s.includes(',')||s.includes('"')?'"'+s.replace(/"/g,'""')+'"':s;});rows.push(row.join(','));});
  const blob=new Blob([rows.join('\n')],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='options-trades-'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(a);a.click();document.body.removeChild(a);toast('Exported '+state.trades.length+' trades');
}
function downloadTemplate(){
  const blob=new Blob([[CSV_FIELDS.join(','),'1,CRWV,CSP,2026-04-15,2026-05-02,70,2.50,1,0,95,-0.25,17,Example,250,open,,,,,,,,,'].join('\n')],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='options-trades-template.csv';document.body.appendChild(a);a.click();document.body.removeChild(a);toast('Template downloaded');
}
function handleImport(event){
  const file=event.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const lines=e.target.result.trim().split('\n');
      const headers=lines[0].split(',').map(h=>h.trim().replace(/^"|"$/g,''));
      const imported=[];
      for(let i=1;i<lines.length;i++){
        const vals=parseCSVLine(lines[i]);if(vals.length<3)continue;const obj={};
        headers.forEach((h,j)=>{let v=vals[j]==null?'':vals[j];if(v===''||v==='null'){obj[h]=null;return;}
          if(['id','contracts','dte'].includes(h))obj[h]=parseInt(v)||0;
          else if(['strike','premium','underlying','iv','delta','totalCredit','closeCost','pnl','feesOpen','feesClose','feesTotal','pnlNet'].includes(h))obj[h]=parseFloat(v)||0;
          else obj[h]=v;
        });imported.push(obj);
      }
      const mode=document.getElementById('import-mode').value;
      if(mode==='replace'){const mx=imported.reduce((m,t)=>Math.max(m,t.id||0),0);state={...state,trades:imported,nextId:mx+1};toast('Replaced with '+imported.length+' trades');}
      else{const existing=new Set(state.trades.map(t=>t.id));let added=0;imported.forEach(t=>{if(!existing.has(t.id)){t.id=state.nextId++;state.trades.push(t);added++;}});toast('Merged: '+added+' new');}
      save();renderSettings();renderDashboard();
    }catch(err){toast('Import failed: '+err.message,'err');}
  };reader.readAsText(file);event.target.value='';
}
function parseCSVLine(line){const r=[];let cur='';let inQ=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(inQ&&line[i+1]==='"'){cur+='"';i++;}else inQ=!inQ;}else if(c===','&&!inQ){r.push(cur.trim());cur='';}else cur+=c;}r.push(cur.trim());return r;}

// ═══════════════════ SERVICE WORKER ═══════════════════
if('serviceWorker'in navigator){const blob=new Blob([atob('__SW_B64__')],{type:'text/javascript'});navigator.serviceWorker.register(URL.createObjectURL(blob)).catch(()=>{});}

// ═══════════════════ INIT ═══════════════════
load();
setTheme(state.settings.theme||'dark');
renderLogForm();
renderDashboard();
