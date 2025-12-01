// Use a generic court shape returned by backend (maps _id to id)
import { Check } from 'lucide-react';

type CourtSelectorProps = {
  courts: any[];
  selectedCourt: any | null;
  onSelect: (court: any) => void;
};

export const CourtSelector = ({ courts, selectedCourt, onSelect }: CourtSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {courts.map((court) => (
        <button
          key={court.id}
          onClick={() => onSelect(court)}
          className={`relative p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
            selectedCourt?.id === court.id
              ? 'border-gray-800 shadow-xl'
              : 'border-gray-200 hover:border-gray-300 shadow-md'
          }`}
          style={{
            background: selectedCourt?.id === court.id
              ? `linear-gradient(135deg, ${court.color}15 0%, ${court.color}30 100%)`
              : 'white',
          }}
        >
          {selectedCourt?.id === court.id && (
            <div
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: court.color }}
            >
              <Check className="w-5 h-5" />
            </div>
          )}

          <div className="flex items-center space-x-4 mb-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ backgroundColor: court.color }}
            >
              {court.name.charAt(0)}
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-bold text-gray-800">{court.name}</h3>
              <p className="text-sm text-gray-500">Professional Court</p>
            </div>
          </div>

          {court.description && (
            <p className="text-gray-600 text-sm">{court.description}</p>
          )}
        </button>
      ))}
    </div>
  );
};
