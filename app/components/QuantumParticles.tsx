import { motion } from "framer-motion";

const particles = [
  { size: 100, top: "10%", left: "10%", color: "bg-purple-500", duration: 8 },
  { size: 140, top: "30%", left: "50%", color: "bg-blue-500", duration: 12 },
  { size: 80, top: "70%", left: "75%", color: "bg-pink-500", duration: 10 },
  { size: 60, top: "20%", left: "80%", color: "bg-purple-400", duration: 6 },
  { size: 90, top: "60%", left: "15%", color: "bg-indigo-500", duration: 9 },
  { size: 70, top: "80%", left: "40%", color: "bg-pink-600", duration: 11 },
  { size: 50, top: "35%", left: "25%", color: "bg-blue-400", duration: 7 },
  { size: 100, top: "15%", left: "60%", color: "bg-fuchsia-500", duration: 10 },
];

export const QuantumParticles = () => {
  return (
    <>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${p.color} opacity-40 blur-xl shadow-[0_0_40px_${p.color.replace("bg-", "rgba(").replace("-500", ",0.4)")}]`}
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            top: p.top,
            left: p.left,
            zIndex: 0,
              // background: "radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 90%)",
            filter: "drop-shadow(0 0 20px rgba(255,255,255,0.2))",
          }}
          animate={{
            y: [0, -25, 0],
            x: [0, 15, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}
    </>
  );
};
