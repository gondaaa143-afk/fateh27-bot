export default function GlassCard({children,className=""}){
  return(
    <div className={`glass rounded-[28px] p-5 soft-shadow ${className}`}>
      {children}
    </div>
  );
}
