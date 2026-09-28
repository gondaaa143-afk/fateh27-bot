export default function Button({children,onClick,variant="primary"}){
  return(
    <button
      onClick={onClick}
      className={`w-full rounded-[18px] py-4 font-semibold transition active:scale-95 ${
        variant==="primary"
          ?"bg-black text-white"
          :"bg-white text-[#111] border border-black/10"
      }`}
    >
      {children}
    </button>
  );
}
