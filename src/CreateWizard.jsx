import { useState, useMemo } from "react";
import {
  C, TC, RC,
  AUTO_PAD, PAD_LABELS,
  CATEGORIES, ENCODINGS, PROTOCOLS
} from "./constants/theme.js";
import TEMPLATES from "../data/templates/cms_field_templates.json";

// FILLER template extracted from JSON
const FILLER_TEMPLATE = TEMPLATES.FILLER;

// ═══════════════════════════════════════
//  Micro Components
// ═══════════════════════════════════════
const B=({c,children,s:sm})=><span style={{display:"inline-flex",alignItems:"center",padding:sm?"1px 5px":"2px 7px",borderRadius:3,fontSize:sm?9:10,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",background:c+"14",color:c,border:`1px solid ${c}25`,letterSpacing:.2,whiteSpace:"nowrap"}}>{children}</span>;

const Input=({label,value,onChange,type="text",placeholder,width,mono,required,disabled,min})=>(
  <div style={{display:"flex",flexDirection:"column",gap:2,width}}>
    {label&&<label style={{fontSize:9,color:C.txD,fontWeight:500}}>{label}{required&&<span style={{color:C.rd}}>*</span>}</label>}
    <input type={type} value={value||""} onChange={e=>onChange(type==="number"?Number(e.target.value):e.target.value)} placeholder={placeholder} disabled={disabled} min={min}
      style={{padding:"5px 7px",background:disabled?C.bg:C.s2,border:`1px solid ${C.bd}`,borderRadius:3,color:disabled?C.txD:C.txB,fontSize:11,fontFamily:mono?"'JetBrains Mono',monospace":"inherit",boxSizing:"border-box",width:"100%",opacity:disabled?.5:1}}/>
  </div>
);

const Select=({label,value,onChange,options,width,required})=>(
  <div style={{display:"flex",flexDirection:"column",gap:2,width}}>
    {label&&<label style={{fontSize:9,color:C.txD,fontWeight:500}}>{label}{required&&<span style={{color:C.rd}}>*</span>}</label>}
    <select value={value||""} onChange={e=>onChange(e.target.value)}
      style={{padding:"5px 7px",background:C.s2,border:`1px solid ${C.bd}`,borderRadius:3,color:C.txB,fontSize:11,fontFamily:"inherit",cursor:"pointer",appearance:"auto"}}>
      {options.map(o=>typeof o==="string"?<option key={o} value={o}>{o}</option>:<option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Check=({label,checked,onChange})=>(
  <label style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:C.tx,cursor:"pointer",userSelect:"none"}}>
    <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} style={{accentColor:C.ac}}/>
    {label}
  </label>
);

// Button variants: primary (main CTA), secondary (outlined), ghost (subtle), danger
const Btn=({children,onClick,primary,secondary,ghost,danger,small,disabled,icon})=>{
  // Determine styles based on variant
  const getStyles = () => {
    if (primary) return {
      background: C.ac,
      border: `1px solid ${C.ac}`,
      color: "#fff",
    };
    if (secondary) return {
      background: "transparent",
      border: `1px solid ${C.ac}`,
      color: C.ac,
    };
    if (ghost) return {
      background: C.s3,
      border: `1px solid ${C.bd}`,
      color: C.tx,
    };
    if (danger) return {
      background: C.rd + "12",
      border: `1px solid ${C.rd}50`,
      color: C.rd,
    };
    // Default: secondary-like
    return {
      background: "transparent",
      border: `1px solid ${C.bd}`,
      color: C.tx,
    };
  };
  const v = getStyles();
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display:"inline-flex",alignItems:"center",gap:5,
      padding:small?"4px 10px":"8px 16px",
      fontSize:small?10:11,fontWeight:600,fontFamily:"inherit",
      borderRadius:4,cursor:disabled?"not-allowed":"pointer",
      opacity:disabled?.4:1,
      ...v,
      transition:"all .15s"
    }}>
      {icon&&<span style={{fontSize:small?11:13}}>{icon}</span>}{children}
    </button>
  );
};

// ═══════════════════════════════════════
//  Step Indicators
// ═══════════════════════════════════════
const STEPS=[
  {id:0,label:"기본 정보",icon:"▦",desc:"전문코드, 인코딩, 프로토콜"},
  {id:1,label:"레코드 구성",icon:"▤",desc:"레코드 타입 및 길이 설정"},
  {id:2,label:"필드 정의",icon:"⚙",desc:"각 레코드별 필드 구성"},
  {id:3,label:"검토 & 저장",icon:"⤓",desc:"최종 확인 및 파일 저장"},
];

// ═══════════════════════════════════════
//  Helper: Extract fields from template TDD
// ═══════════════════════════════════════
const extractFields = (tdd, recordType) => {
  const rec = tdd.layout.records.find(r => r.recordType === recordType);
  if (!rec) return [];
  return rec.fields.map(f => ({
    id: f.id,
    name: f.name,
    type: f.type,
    length: f.length,
    required: f.required,
    fixedValue: f.fixedValue,
    pad: f.pad,
    mac: f.mac || false,
    description: f.description || ""
  }));
};

const getRecordLength = (tdd, recordType) => {
  const rec = tdd.layout.records.find(r => r.recordType === recordType);
  return rec ? rec.length : 120;
};

// ═══════════════════════════════════════
//  Main Wizard
// ═══════════════════════════════════════
export default function CreateWizard({onComplete,onCancel,template,editTarget}){
  const [step,setStep]=useState(0);

  // Determine source: editTarget takes priority over template
  const source = editTarget || template;
  const isEditMode = !!editTarget;

  // ── Step 1: Basic Info (edit/template-aware) ──
  const [code,setCode]=useState(
    editTarget?.code ||
    (template?.code ? template.code + "_COPY" : "")
  );
  const [name,setName]=useState(
    editTarget?.name ||
    (template?.name ? template.name + " (복사본)" : "")
  );
  const [category,setCategory]=useState(source?.category || CATEGORIES[0]);
  const [encoding,setEncoding]=useState(source?.protocol?.encoding || "EUC-KR");
  const [protocol,setProtocol]=useState(source?.protocol?.type || "FILE_BATCH");

  // ── Step 2: Record Setup (edit/template-aware) ──
  const sourceHasHeader = source ? source.layout.records.some(r => r.recordType === "HEADER") : true;
  const sourceHasTrailer = source ? source.layout.records.some(r => r.recordType === "TRAILER") : true;
  const sourceHeaderLen = source ? getRecordLength(source, "HEADER") : 120;
  const sourceDataLen = source ? getRecordLength(source, "DATA") : 120;
  const sourceTrailerLen = source ? getRecordLength(source, "TRAILER") : 120;
  const sourceSharedLen = source ? (sourceHeaderLen === sourceDataLen && sourceDataLen === sourceTrailerLen) : true;

  const [useHeader,setUseHeader]=useState(sourceHasHeader);
  const [useTrailer,setUseTrailer]=useState(sourceHasTrailer);
  const [sharedLength,setSharedLength]=useState(sourceSharedLen);
  const [commonLen,setCommonLen]=useState(sourceDataLen);
  const [headerLen,setHeaderLen]=useState(sourceHeaderLen);
  const [dataLen,setDataLen]=useState(sourceDataLen);
  const [trailerLen,setTrailerLen]=useState(sourceTrailerLen);

  // ── Step 3: Fields (edit/template-aware) ──
  const [headerFields,setHeaderFields]=useState(source ? extractFields(source, "HEADER") : []);
  const [dataFields,setDataFields]=useState(source ? extractFields(source, "DATA") : []);
  const [trailerFields,setTrailerFields]=useState(source ? extractFields(source, "TRAILER") : []);
  const [activeRec,setActiveRec]=useState(sourceHasHeader ? "HEADER" : "DATA");

  // ── Toast ──
  const [toast,setToast]=useState(null);
  const showToast=(msg,type="info")=>{setToast({msg,type});setTimeout(()=>setToast(null),2500);};

  // ── Computed ──
  const getLen=(recType)=>sharedLength?commonLen:recType==="HEADER"?headerLen:recType==="DATA"?dataLen:trailerLen;
  const getFields=(recType)=>recType==="HEADER"?headerFields:recType==="DATA"?dataFields:trailerFields;
  const setFields=(recType,fields)=>recType==="HEADER"?setHeaderFields(fields):recType==="DATA"?setDataFields(fields):setTrailerFields(fields);

  const recTypes=useMemo(()=>{
    const r=[];
    if(useHeader) r.push("HEADER");
    r.push("DATA");
    if(useTrailer) r.push("TRAILER");
    return r;
  },[useHeader,useTrailer]);

  // compute offsets for fields
  const withOffsets=(fields)=>{
    let off=0;
    return fields.map(f=>{ const r={...f,offset:off}; off+=f.length; return r; });
  };

  const totalFieldLen=(fields)=>fields.reduce((s,f)=>s+f.length,0);

  // ── Validation ──
  const step1Valid=code.trim().length>=2 && name.trim().length>=1;
  const step2Valid=sharedLength
    ? commonLen>=10
    : (!useHeader || headerLen>=10) && dataLen>=10 && (!useTrailer || trailerLen>=10);
  const step3Valid=dataFields.length>0;

  // ── buildTDD (shared) ──
  const buildTDD=()=>({
    // 편집 모드면 기존 ID/version/status 유지, 아니면 새로 생성
    id: isEditMode ? editTarget.id : `CMS_${code.toUpperCase()}_${Date.now()%100000}`,
    name, code:code.toUpperCase(), category,
    version: isEditMode ? editTarget.version : "1.0.0",
    status: isEditMode ? editTarget.status : "DRAFT",
    updatedAt:new Date().toISOString().slice(0,10),
    protocol:{type:protocol,encoding},
    layout:{records:recTypes.map(rt=>({
      id:rt.toLowerCase(),
      recordType:rt,
      length:getLen(rt),
      fields:withOffsets(getFields(rt)).map(f=>({
        id:f.id,name:f.name,offset:f.offset,length:f.length,
        type:f.type,pad:f.pad,fixedValue:f.fixedValue,
        required:f.required,sourceRef:null,transformRef:null,
        description:f.description,mac:f.mac||false,
      })),
    }))},
    // 편집 모드면 기존 transforms/dataSources/pipeline 등 유지
    transforms: isEditMode ? editTarget.transforms : [],
    dataSources: isEditMode ? editTarget.dataSources : [],
    pipeline: isEditMode ? editTarget.pipeline : {steps:[]},
    testCases: isEditMode ? editTarget.testCases : [],
    validationRules: isEditMode ? editTarget.validationRules : [],
  });

  // ════════════════════════════
  //  Step 1: Basic Info
  // ════════════════════════════
  const renderStep1=()=>(
    <div style={{maxWidth:540}}>
      <div style={{fontSize:14,fontWeight:700,color:C.txB,marginBottom:4}}>전문 기본 정보</div>
      <div style={{fontSize:10,color:C.txD,marginBottom:20}}>CMS 전문(TDD)의 식별 정보와 통신 프로토콜을 설정합니다.</div>

      {isEditMode && (
        <div style={{padding:"10px 14px",background:C.cy+"10",border:`1px solid ${C.cy}30`,borderRadius:4,marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>✎</span>
          <div>
            <div style={{fontSize:11,color:C.cy,fontWeight:600}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace"}}>{editTarget.code}</span> {editTarget.name} 편집 중
            </div>
            <div style={{fontSize:9,color:C.txD}}>레이아웃을 수정하고 저장하면 기존 TDD가 업데이트됩니다.</div>
          </div>
        </div>
      )}

      {!isEditMode && template && (
        <div style={{padding:"10px 14px",background:C.pr+"10",border:`1px solid ${C.pr}30`,borderRadius:4,marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>📋</span>
          <div>
            <div style={{fontSize:11,color:C.pr,fontWeight:600}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace"}}>{template.code}</span> {template.name} 기반으로 생성
            </div>
            <div style={{fontSize:9,color:C.txD}}>레코드 구조 및 필드 정의가 복사되었습니다. 코드와 이름을 수정해주세요.</div>
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        <Input label={isEditMode ? "전문코드 (변경 불가)" : "전문코드"} value={code} onChange={setCode} placeholder="EB13, EB21, EC21..." mono required disabled={isEditMode} />
        <Input label="전문명" value={name} onChange={setName} placeholder="출금이체신청 (기관접수)" required />
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
        <Select label="카테고리" value={category} onChange={setCategory} options={CATEGORIES} required/>
        <Select label="인코딩" value={encoding} onChange={setEncoding} options={ENCODINGS} required/>
        <Select label="프로토콜" value={protocol} onChange={setProtocol} options={PROTOCOLS.map(p=>({value:p,label:p==="FILE_BATCH"?"파일 배치":"TCP 소켓"}))} required/>
      </div>

      <div style={{padding:12,background:C.s3,borderRadius:4,border:`1px solid ${C.bd}`}}>
        <div style={{fontSize:10,color:C.txD,marginBottom:6}}>💡 CMS 전문코드 참조</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,fontSize:9,fontFamily:"'JetBrains Mono',monospace"}}>
          {[["EB11/EB12","출금이체신청(은행접수) 120B"],["EB13/EB14","출금이체신청(기관접수) 120B"],["EB21/EB22","출금이체-익일출금 150B"],["EC21/EC22","출금이체-당일출금 150B"],["EB31/EB32","입금이체 150B"],["EI13","자동납부동의자료 1024B"],["EI11","원장조회결과 150B"]].map(([c,d])=>(
            <div key={c} style={{padding:"3px 6px",background:C.s2,borderRadius:2}}>
              <span style={{color:C.ac}}>{c}</span> <span style={{color:C.txD}}>{d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ════════════════════════════
  //  Step 2: Record Setup
  // ════════════════════════════
  const renderStep2=()=>(
    <div style={{maxWidth:540}}>
      <div style={{fontSize:14,fontWeight:700,color:C.txB,marginBottom:4}}>레코드 구성</div>
      <div style={{fontSize:10,color:C.txD,marginBottom:20}}>사용할 레코드 타입과 각 레코드의 바이트 길이를 설정합니다.</div>

      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
        <div style={{display:"flex",gap:16,alignItems:"center"}}>
          <Check label="HEADER 레코드 사용" checked={useHeader} onChange={setUseHeader}/>
          <Check label="TRAILER 레코드 사용" checked={useTrailer} onChange={setUseTrailer}/>
        </div>
        <Check label="모든 레코드 동일 길이 사용" checked={sharedLength} onChange={setSharedLength}/>
      </div>

      {sharedLength?(
        <div style={{marginBottom:16}}>
          <Input label="공통 레코드 길이 (Bytes)" value={commonLen} onChange={setCommonLen} type="number" min={10} width="200px"/>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
          {useHeader&&<Input label="HEADER 길이 (Bytes)" value={headerLen} onChange={setHeaderLen} type="number" min={10}/>}
          <Input label="DATA 길이 (Bytes)" value={dataLen} onChange={setDataLen} type="number" min={10}/>
          {useTrailer&&<Input label="TRAILER 길이 (Bytes)" value={trailerLen} onChange={setTrailerLen} type="number" min={10}/>}
        </div>
      )}

      <div style={{padding:12,background:C.s3,borderRadius:4,border:`1px solid ${C.bd}`,marginBottom:12}}>
        <div style={{fontSize:10,color:C.txD,marginBottom:8}}>레코드 구조 미리보기</div>
        <div style={{display:"flex",gap:8}}>
          {recTypes.map(rt=>(
            <div key={rt} style={{flex:1,padding:10,background:C.s2,borderRadius:3,border:`1px solid ${RC[rt]}25`,borderTop:`2px solid ${RC[rt]}`}}>
              <div style={{fontSize:10,fontWeight:700,color:RC[rt],marginBottom:3}}>{rt}</div>
              <div style={{fontSize:20,fontWeight:700,color:C.txB,fontFamily:"'JetBrains Mono',monospace"}}>{getLen(rt)}<span style={{fontSize:9,color:C.txD,fontWeight:400}}>B</span></div>
              <div style={{fontSize:8,color:C.txD}}>{rt==="HEADER"?"H 식별 + 기관정보":rt==="DATA"?"R 식별 + 업무데이터":"T 식별 + 집계정보"}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:10,background:C.yl+"08",border:`1px solid ${C.yl}25`,borderRadius:4,fontSize:9,color:C.yl}}>
        ⚠️ CMS 표준: 출금이체신청(EB11~14)=120B, 출금이체/입금이체(EB21,EC21,EB31)=150B, 동의자료(EI13)=1024B
      </div>
    </div>
  );

  // ════════════════════════════
  //  Step 3: Field Definition
  // ════════════════════════════
  const renderStep3=()=>{
    const fields=getFields(activeRec);
    const recLen=getLen(activeRec);
    const used=totalFieldLen(fields);
    const remain=recLen-used;
    const fieldsO=withOffsets(fields);

    const addField=(template)=>{
      // 고유 ID 생성: 기존 ID가 있으면 숫자 suffix 증가
      let newId=template.id;
      let counter=1;
      while(fields.some(x=>x.id===newId)){
        newId=`${template.id}_${counter++}`;
      }
      const f={...template,id:newId};
      setFields(activeRec,[...fields,f]);
    };

    const addBlank=()=>{
      const idx=fields.length+1;
      const prefix=activeRec==="HEADER"?"h_":activeRec==="DATA"?"d_":"t_";
      addField({id:`${prefix}field_${idx}`,name:"",type:"AN",length:1,required:false,fixedValue:null,pad:"SPACE_RIGHT",mac:false,description:""});
    };

    const addFiller=()=>{
      if(remain<=0) return;
      const prefix=activeRec==="HEADER"?"h_":activeRec==="DATA"?"d_":"t_";
      const f={...FILLER_TEMPLATE,id:`${prefix}filler${fields.filter(x=>x.name==="FILLER").length||""}`,length:remain};
      setFields(activeRec,[...fields,f]);
    };

    const updateField=(idx,key,val)=>{
      const nf=[...fields];
      nf[idx]={...nf[idx],[key]:val};
      // auto-set pad when type changes
      if(key==="type" && AUTO_PAD[val]){
        nf[idx].pad=AUTO_PAD[val];
      }
      setFields(activeRec,nf);
    };

    const removeField=(idx)=>{
      setFields(activeRec,fields.filter((_,i)=>i!==idx));
    };

    const moveField=(idx,dir)=>{
      if(idx+dir<0||idx+dir>=fields.length) return;
      const nf=[...fields];
      [nf[idx],nf[idx+dir]]=[nf[idx+dir],nf[idx]];
      setFields(activeRec,nf);
    };

    const applyTemplate=(recType)=>{
      const tpls=TEMPLATES[recType]||[];
      if(fields.length>0 && !confirm(`기존 ${fields.length}개 필드가 삭제됩니다. 템플릿을 적용하시겠습니까?`)) return;
      setFields(activeRec,tpls.map(t=>({...t})));
      showToast(`${recType} 템플릿 ${tpls.length}개 필드 적용됨`,"gn");
    };

    return(
      <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:C.txB}}>필드 정의</div>
            <div style={{fontSize:10,color:C.txD}}>각 레코드의 필드를 순서대로 구성합니다. Offset은 자동 계산됩니다.</div>
          </div>
        </div>

        {/* Record type tabs */}
        <div style={{display:"flex",gap:0,marginBottom:8,flexShrink:0}}>
          {recTypes.map(rt=>{
            const a=activeRec===rt;
            const fl=getFields(rt);
            const u=totalFieldLen(fl);
            const rl=getLen(rt);
            return(
              <button key={rt} onClick={()=>setActiveRec(rt)} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 14px",fontSize:10,fontWeight:a?700:400,color:a?RC[rt]:C.txD,background:a?RC[rt]+"10":"transparent",border:`1px solid ${a?RC[rt]+"38":C.bd}`,borderBottom:a?`2px solid ${RC[rt]}`:"2px solid transparent",cursor:"pointer",fontFamily:"inherit",transition:"all .08s"}}>
                {rt} <span style={{fontSize:8,color:a?RC[rt]:C.txD}}>({fl.length}f, {u}/{rl}B)</span>
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div style={{display:"flex",gap:6,alignItems:"center",padding:"6px 0",flexShrink:0,flexWrap:"wrap"}}>
          <Btn onClick={addBlank} small icon="＋">필드 추가</Btn>
          <Btn onClick={addFiller} small icon="⬜" disabled={remain<=0}>FILLER ({remain}B)</Btn>
          <div style={{width:1,height:16,background:C.bd}}/>
          <Btn onClick={()=>applyTemplate(activeRec)} small icon="📋">CMS 템플릿 적용</Btn>
          <div style={{flex:1}}/>
          <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace"}}>
            <span style={{color:remain===0?C.gn:remain<0?C.rd:C.or}}>{used}</span>
            <span style={{color:C.txD}}>/{recLen}B</span>
            {remain!==0&&<span style={{color:remain<0?C.rd:C.or,marginLeft:6}}>{remain>0?`남은 ${remain}B`:`초과 ${Math.abs(remain)}B`}</span>}
            {remain===0&&<span style={{color:C.gn,marginLeft:6}}>✓ 정확히 일치</span>}
          </div>
        </div>

        {/* Byte bar */}
        <div style={{height:20,background:C.s2,borderRadius:3,border:`1px solid ${C.bd}`,overflow:"hidden",display:"flex",marginBottom:8,flexShrink:0}}>
          {fieldsO.map((f,i)=>{
            const pct=(f.length/recLen)*100;
            const colors=[C.ac,C.gn,C.or,C.pr,C.cy,C.yl,C.rd,"#60a0fa","#f070b0","#8088f8"];
            return(
              <div key={i} title={`${f.name||f.id} [${f.offset}:${f.offset+f.length-1}] ${f.length}B ${f.type}`}
                style={{width:`${pct}%`,background:colors[i%colors.length]+"30",borderRight:i<fieldsO.length-1?`1px solid ${C.bg}`:undefined,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                {pct>4&&<span style={{fontSize:7,color:colors[i%colors.length],whiteSpace:"nowrap"}}>{f.length}</span>}
              </div>
            );
          })}
          {remain>0&&<div style={{width:`${(remain/recLen)*100}%`,background:C.rd+"10",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:7,color:C.rd}}>{remain}</span>
          </div>}
        </div>

        {/* Field table */}
        <div style={{flex:1,overflow:"auto",borderRadius:4,border:`1px solid ${C.bd}`}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
            <thead>
              <tr style={{background:C.s3,position:"sticky",top:0,zIndex:1}}>
                {["#","필드 ID","필드명","Type","Length","Offset","End","필수","고정값","Padding","MAC","비고",""].map((h,i)=>(
                  <th key={i} style={{padding:"5px 6px",borderBottom:`1px solid ${C.bd}`,textAlign:"left",color:C.txD,fontWeight:500,fontSize:9,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fieldsO.length===0?(
                <tr><td colSpan={13} style={{padding:30,textAlign:"center",color:C.txD,fontSize:11}}>
                  필드가 없습니다. "필드 추가" 또는 "CMS 템플릿 적용"으로 시작하세요.
                </td></tr>
              ):fieldsO.map((f,idx)=>{
                const cumEnd=f.offset+f.length;
                return(
                  <tr key={idx} style={{borderBottom:`1px solid ${C.bd}10`}}>
                    <td style={{padding:"4px 6px",color:C.txD,fontSize:9,textAlign:"center"}}>{idx+1}</td>
                    <td style={{padding:"4px 4px"}}>
                      <input value={f.id} onChange={e=>updateField(idx,"id",e.target.value)}
                        style={{width:"100%",minWidth:80,padding:"2px 4px",background:C.s2,border:`1px solid ${C.bd}`,borderRadius:2,color:C.cy,fontSize:9,fontFamily:"'JetBrains Mono',monospace"}}/>
                    </td>
                    <td style={{padding:"4px 4px"}}>
                      <input value={f.name} onChange={e=>updateField(idx,"name",e.target.value)}
                        style={{width:"100%",minWidth:60,padding:"2px 4px",background:C.s2,border:`1px solid ${C.bd}`,borderRadius:2,color:C.txB,fontSize:10}}/>
                    </td>
                    <td style={{padding:"4px 4px"}}>
                      <select value={f.type} onChange={e=>updateField(idx,"type",e.target.value)}
                        style={{padding:"2px 2px",background:C.s2,border:`1px solid ${C.bd}`,borderRadius:2,color:TC[f.type]||C.tx,fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>
                        {["A","AN","N","H","HAN"].map(t=><option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td style={{padding:"4px 4px",width:50}}>
                      <input type="number" value={f.length} min={1} onChange={e=>updateField(idx,"length",Number(e.target.value))}
                        style={{width:45,padding:"2px 4px",background:C.s2,border:`1px solid ${C.bd}`,borderRadius:2,color:C.txB,fontSize:10,fontFamily:"'JetBrains Mono',monospace",textAlign:"center"}}/>
                    </td>
                    <td style={{padding:"4px 6px",fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:C.txD,textAlign:"center"}}>{f.offset}</td>
                    <td style={{padding:"4px 6px",fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:cumEnd<=getLen(activeRec)?C.txB:C.rd,textAlign:"center",fontWeight:600}}>{cumEnd}</td>
                    <td style={{padding:"4px 6px",textAlign:"center"}}>
                      <input type="checkbox" checked={f.required} onChange={e=>updateField(idx,"required",e.target.checked)} style={{accentColor:C.ac}}/>
                    </td>
                    <td style={{padding:"4px 4px"}}>
                      <input value={f.fixedValue??""} onChange={e=>updateField(idx,"fixedValue",e.target.value||null)} placeholder="—"
                        style={{width:50,padding:"2px 4px",background:C.s2,border:`1px solid ${C.bd}`,borderRadius:2,color:C.yl,fontSize:9,fontFamily:"'JetBrains Mono',monospace"}}/>
                    </td>
                    <td style={{padding:"4px 4px"}}>
                      <select value={f.pad} onChange={e=>updateField(idx,"pad",e.target.value)}
                        style={{padding:"2px 2px",background:C.s2,border:`1px solid ${C.bd}`,borderRadius:2,color:C.tx,fontSize:8}}>
                        {Object.entries(PAD_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                    <td style={{padding:"4px 6px",textAlign:"center"}}>
                      <input type="checkbox" checked={f.mac||false} onChange={e=>updateField(idx,"mac",e.target.checked)} style={{accentColor:C.or}}/>
                    </td>
                    <td style={{padding:"4px 4px"}}>
                      <input value={f.description||""} onChange={e=>updateField(idx,"description",e.target.value)} placeholder="설명"
                        style={{width:"100%",minWidth:60,padding:"2px 4px",background:C.s2,border:`1px solid ${C.bd}`,borderRadius:2,color:C.txD,fontSize:9}}/>
                    </td>
                    <td style={{padding:"3px 4px",whiteSpace:"nowrap"}}>
                      <button onClick={()=>moveField(idx,-1)} disabled={idx===0} title="위로"
                        style={{background:"none",border:"none",color:idx===0?C.bdL:C.txD,cursor:idx===0?"default":"pointer",fontSize:9,padding:1}}>▲</button>
                      <button onClick={()=>moveField(idx,1)} disabled={idx===fieldsO.length-1} title="아래로"
                        style={{background:"none",border:"none",color:idx===fieldsO.length-1?C.bdL:C.txD,cursor:idx===fieldsO.length-1?"default":"pointer",fontSize:9,padding:1}}>▼</button>
                      <button onClick={()=>removeField(idx)} title="삭제"
                        style={{background:"none",border:"none",color:C.rd,cursor:"pointer",fontSize:9,padding:1,marginLeft:2}}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Template quick-add palette */}
        <div style={{marginTop:8,flexShrink:0}}>
          <div style={{fontSize:9,color:C.txD,marginBottom:4}}>빠른 추가 (CMS 공통 필드):</div>
          <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
            {(TEMPLATES[activeRec]||[]).map((t,i)=>(
              <button key={i} onClick={()=>addField({...t})} title={`${t.type} ${t.length}B - ${t.description}`}
                style={{padding:"2px 7px",fontSize:8,background:C.s3,border:`1px solid ${C.bd}`,borderRadius:2,color:C.tx,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                <span style={{color:TC[t.type],fontWeight:600,fontFamily:"'JetBrains Mono',monospace"}}>{t.type}</span> {t.name} <span style={{color:C.txD}}>{t.length}B</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ════════════════════════════
  //  Step 4: Review & Export
  // ════════════════════════════
  const renderStep4=()=>{
    const allRows=[];
    recTypes.forEach(rt=>{
      const fl=withOffsets(getFields(rt));
      const rl=getLen(rt);
      fl.forEach((f,i)=>allRows.push({...f,recType:rt,recLen:rl,idx:i+1}));
    });

    const warnings=[];
    recTypes.forEach(rt=>{
      const fl=getFields(rt);
      const rl=getLen(rt);
      const used=totalFieldLen(fl);
      if(used!==rl) warnings.push({type:used>rl?"error":"warn",msg:`${rt}: 필드합계(${used}B) ≠ 레코드길이(${rl}B) — 차이 ${Math.abs(rl-used)}B`});
      if(fl.length===0) warnings.push({type:"error",msg:`${rt}: 필드가 정의되지 않았습니다`});
      // check duplicate IDs
      const ids=fl.map(f=>f.id);
      const dups=ids.filter((id,i)=>ids.indexOf(id)!==i);
      if(dups.length) warnings.push({type:"warn",msg:`${rt}: 중복 필드ID — ${[...new Set(dups)].join(", ")}`});
    });

    const exportJSON=()=>{
      const tdd=buildTDD();
      const blob=new Blob([JSON.stringify(tdd,null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;
      a.download=`tdd_${code.toUpperCase()}_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("JSON 파일 다운로드 완료","gn");
    };

    const addToRegistry=()=>{
      if(warnings.some(w=>w.type==="error")){
        showToast("오류를 먼저 해결해주세요","rd");
        return;
      }
      const tdd=buildTDD();
      if(onComplete) onComplete(tdd);
      showToast(isEditMode ? "TDD가 업데이트되었습니다" : "레지스트리에 추가되었습니다","gn");
    };

    return(
      <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:C.txB}}>검토 & 저장</div>
            <div style={{fontSize:10,color:C.txD}}>최종 레이아웃을 확인하고 JSON 파일로 저장합니다.</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={exportJSON} secondary icon="💾">JSON 다운로드</Btn>
            <Btn onClick={addToRegistry} primary icon={isEditMode ? "✓" : "＋"} disabled={warnings.some(w=>w.type==="error")}>{isEditMode ? "저장" : "레지스트리 추가"}</Btn>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{display:"flex",gap:8,marginBottom:8,flexShrink:0}}>
          <div style={{padding:8,background:C.s3,borderRadius:3,border:`1px solid ${C.bd}`,flex:1}}>
            <div style={{fontSize:8,color:C.txD}}>전문코드</div>
            <div style={{fontSize:16,fontWeight:800,color:C.ac,fontFamily:"'JetBrains Mono',monospace"}}>{code.toUpperCase()||"—"}</div>
            <div style={{fontSize:9,color:C.tx}}>{name||"—"}</div>
          </div>
          <div style={{padding:8,background:C.s3,borderRadius:3,border:`1px solid ${C.bd}`,flex:1}}>
            <div style={{fontSize:8,color:C.txD}}>인코딩 / 프로토콜</div>
            <div style={{fontSize:12,fontWeight:600,color:C.txB}}>{encoding}</div>
            <div style={{fontSize:9,color:C.txD}}>{protocol==="FILE_BATCH"?"파일 배치":"TCP 소켓"}</div>
          </div>
          {recTypes.map(rt=>(
            <div key={rt} style={{padding:8,background:C.s3,borderRadius:3,border:`1px solid ${RC[rt]}20`,borderTop:`2px solid ${RC[rt]}`,flex:1}}>
              <div style={{fontSize:8,color:C.txD}}>{rt}</div>
              <div style={{fontSize:12,fontWeight:700,color:RC[rt],fontFamily:"'JetBrains Mono',monospace"}}>{getFields(rt).length} <span style={{fontSize:8,fontWeight:400}}>fields</span></div>
              <div style={{fontSize:9,color:totalFieldLen(getFields(rt))===getLen(rt)?C.gn:C.rd,fontFamily:"'JetBrains Mono',monospace"}}>{totalFieldLen(getFields(rt))}/{getLen(rt)}B</div>
            </div>
          ))}
        </div>

        {/* Warnings */}
        {warnings.length>0&&(
          <div style={{marginBottom:8,flexShrink:0}}>
            {warnings.map((w,i)=>(
              <div key={i} style={{padding:"4px 8px",marginBottom:2,fontSize:9,borderRadius:2,background:w.type==="error"?C.rd+"10":C.or+"10",border:`1px solid ${w.type==="error"?C.rd:C.or}25`,color:w.type==="error"?C.rd:C.or}}>
                {w.type==="error"?"❌":"⚠️"} {w.msg}
              </div>
            ))}
          </div>
        )}

        {/* Full table */}
        <div style={{flex:1,overflow:"auto",borderRadius:4,border:`1px solid ${C.bd}`}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
            <thead>
              <tr style={{background:C.s3,position:"sticky",top:0,zIndex:1}}>
                {["Record","#","필드 ID","필드명","Offset","Len","End","Type","Pad","필수","고정값","MAC","비고"].map((h,i)=>(
                  <th key={i} style={{padding:"5px 6px",borderBottom:`1px solid ${C.bd}`,textAlign:"left",color:C.txD,fontWeight:500,fontSize:9,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allRows.length===0?(
                <tr><td colSpan={13} style={{padding:30,textAlign:"center",color:C.txD}}>정의된 필드가 없습니다.</td></tr>
              ):allRows.map((f,i)=>{
                const isFirst=i===0||allRows[i-1].recType!==f.recType;
                const cumEnd=f.offset+f.length;
                return(
                  <tr key={i} style={{borderTop:isFirst?`2px solid ${RC[f.recType]}40`:undefined,borderBottom:`1px solid ${C.bd}08`}}>
                    <td style={{padding:"4px 6px"}}>{isFirst&&<B c={RC[f.recType]} s>{f.recType[0]}</B>}</td>
                    <td style={{padding:"4px 6px",color:C.txD,fontSize:9,textAlign:"center"}}>{f.idx}</td>
                    <td style={{padding:"4px 6px",fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.cy}}>{f.id}</td>
                    <td style={{padding:"4px 6px",color:C.txB,fontSize:10}}>{f.name}</td>
                    <td style={{padding:"4px 6px",fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.txD,textAlign:"center"}}>{f.offset}</td>
                    <td style={{padding:"4px 6px",fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.txB,textAlign:"center",fontWeight:600}}>{f.length}</td>
                    <td style={{padding:"4px 6px",fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:cumEnd<=f.recLen?C.txB:C.rd,textAlign:"center"}}>{cumEnd}</td>
                    <td style={{padding:"4px 6px"}}><B c={TC[f.type]||C.tx} s>{f.type}</B></td>
                    <td style={{padding:"4px 6px",fontSize:8,color:C.txD}}>{PAD_LABELS[f.pad]||f.pad}</td>
                    <td style={{padding:"4px 6px",textAlign:"center",color:f.required?C.gn:C.txD,fontSize:9}}>{f.required?"Y":"—"}</td>
                    <td style={{padding:"4px 6px",fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.yl}}>{f.fixedValue!=null?`"${f.fixedValue}"`:<span style={{color:C.txD}}>—</span>}</td>
                    <td style={{padding:"4px 6px",textAlign:"center",color:f.mac?C.or:C.txD,fontSize:9}}>{f.mac?"✓":"—"}</td>
                    <td style={{padding:"4px 6px",fontSize:9,color:C.txD,maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.description||"—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════
  //  Main Render
  // ═══════════════════════════════════════
  return(
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Toast */}
      {toast&&(
        <div style={{position:"fixed",top:16,right:16,padding:"8px 16px",background:toast.type==="gn"?C.gnD:toast.type==="rd"?C.rdD:C.s3,border:`1px solid ${toast.type==="gn"?C.gn:toast.type==="rd"?C.rd:C.ac}40`,borderRadius:4,fontSize:11,color:toast.type==="gn"?C.gn:toast.type==="rd"?C.rd:C.ac,zIndex:100,animation:"fadeIn .2s ease"}}>
          {toast.msg}
        </div>
      )}

      {/* Step indicator */}
      <div style={{display:"flex",gap:0,padding:"0 14px",background:C.s,borderBottom:`1px solid ${C.bd}`,flexShrink:0}}>
        {STEPS.map((s,i)=>{
          const active=step===i;
          const done=step>i;
          return(
            <button key={i} onClick={()=>{
              if(i<step || (i===1&&step1Valid) || (i===2&&step1Valid&&step2Valid) || (i===3&&step1Valid&&step2Valid&&step3Valid) || i<=step) setStep(i);
            }}
              style={{display:"flex",alignItems:"center",gap:5,padding:"8px 14px",fontSize:10,fontWeight:active?700:400,color:active?C.ac:done?C.gn:C.txD,background:active?C.ac+"08":"transparent",border:"none",borderBottom:active?`2px solid ${C.ac}`:"2px solid transparent",cursor:"pointer",fontFamily:"inherit",transition:"all .08s"}}>
              <span style={{width:18,height:18,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,background:active?C.ac+"20":done?C.gn+"20":C.s3,color:active?C.ac:done?C.gn:C.txD,border:`1px solid ${active?C.ac:done?C.gn:C.bd}40`}}>
                {done?"✓":i+1}
              </span>
              <span>{s.label}</span>
            </button>
          );
        })}
        <div style={{flex:1}}/>
        <Btn onClick={onCancel} ghost small icon="✕">취소</Btn>
      </div>

      {/* Step content */}
      <div style={{flex:1,padding:16,overflow:"auto"}}>
        {step===0&&renderStep1()}
        {step===1&&renderStep2()}
        {step===2&&renderStep3()}
        {step===3&&renderStep4()}
      </div>

      {/* Navigation */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",background:C.s,borderTop:`1px solid ${C.bd}`,flexShrink:0}}>
        <Btn onClick={()=>setStep(Math.max(0,step-1))} secondary disabled={step===0} icon="←">이전</Btn>
        <div style={{fontSize:9,color:C.txD}}>{STEPS[step].desc}</div>
        {step<3?(
          <Btn onClick={()=>setStep(step+1)} primary disabled={step===0?!step1Valid:step===1?!step2Valid:!step3Valid}>다음 →</Btn>
        ):(
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={()=>{
              const tdd=buildTDD();
              const blob=new Blob([JSON.stringify(tdd,null,2)],{type:"application/json"});
              const url=URL.createObjectURL(blob);
              const a=document.createElement("a");
              a.href=url;
              a.download=`tdd_${code.toUpperCase()}_${new Date().toISOString().slice(0,10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
              showToast("JSON 파일 다운로드 완료","gn");
            }} secondary icon="💾">JSON 다운로드</Btn>
            <Btn onClick={()=>{
              const tdd=buildTDD();
              if(onComplete) onComplete(tdd);
              showToast(isEditMode ? "TDD가 업데이트되었습니다" : "레지스트리에 추가되었습니다","gn");
            }} primary icon="✓">{isEditMode ? "저장" : "완료"}</Btn>
          </div>
        )}
      </div>
    </div>
  );
}
