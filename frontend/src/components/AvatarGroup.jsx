import React from "react";

const AvatarGroup = ({ avatars = [], maxVisible = 5 }) => {
  const visibleAvatars = avatars.slice(0, maxVisible);
  const remainingCount = Math.max(avatars.length - maxVisible, 0);

  return (
    <div className="flex items-center">
      {visibleAvatars.map((item, index) => {
        const avatar = typeof item === "string" ? item : item?.profileImageUrl;

        const name =
          typeof item === "string"
            ? `Developer ${index + 1}`
            : item?.name || item?.email || `Developer ${index + 1}`;

        return (
          <div
            key={item?._id || index}
            className={`relative group ${index !== 0 ? "-ml-3" : ""}`}
            style={{ zIndex: visibleAvatars.length - index }}
          >
            <img
              src={avatar || "/default-avatar.png"}
              alt={name}
              title={name}
              className="w-10 h-10 rounded-full object-cover border-[3px] border-white shadow-sm transition-transform duration-200 group-hover:scale-110"
            />

            {/* Developer name tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-md shadow-lg z-50 pointer-events-none">
              {name}
            </div>
          </div>
        );
      })}

      {remainingCount > 0 && (
        <div
          title={`${remainingCount} more assigned developer(s)`}
          className="w-10 h-10 -ml-3 flex items-center justify-center bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border-[3px] border-white shadow-sm"
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default AvatarGroup;
