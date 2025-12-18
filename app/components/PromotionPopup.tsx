import { useState, useEffect } from "react";

interface Button {
  Name: string;
  Link: string;
}

interface Promotion {
  title: string;
  message?: string;
  imageUrl?: string;
  button?: Button;
}


interface Props {
  promotion: Promotion | null;
}

const PromotionPopup: React.FC<Props> = ({ promotion }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!promotion || !visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-background rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-hidden relative border flex flex-col">
  {/* Scrollable content */}
  <div className="overflow-y-auto flex-grow p-0">
    
    {/* Sticky top title */}
    <div className="sticky top-0 z-10 px-6 pt-4 pb-2 border-b bg-background">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold dark:text-cyan-300 text-rose-600">{promotion.title}</h2>
        <button
          onClick={() => setVisible(false)}
          className="text-muted-foreground text-xl"
        >
          &times;
        </button>
      </div>
    </div>

    {/* Scrollable content */}
    <div className="px-6 pb-6">
      {promotion.imageUrl && (
        <img
          src={promotion.imageUrl}
          alt="Promotion"
          className="rounded-lg w-full max-h-64 object-cover my-4 border"
        />
      )}

      {promotion.message && (
        <p className="text-foreground whitespace-pre-line text-left">
          {promotion.message}
        </p>
      )}
    </div>
  </div>

  {/* Sticky bottom button */}
{promotion.button?.Link && /^https?:\/\//.test(promotion.button.Link) && (
  <div className="sticky bottom-0 bg-background border-t px-6 py-4">
    <a
      href={promotion.button.Link}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full text-center bg-purple-500 hover:bg-purple-600 dark:bg-rose-600 dark:hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition duration-200"
    >
      {promotion.button.Name || "Learn More"}
    </a>
  </div>
)}

</div>

    </div>
  );
};

export default PromotionPopup;
