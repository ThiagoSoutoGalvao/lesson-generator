export default function Spinner({ message, color = 'text-blue-500', textColor = 'text-gray-500' }) {
    return (
        <div className="flex flex-col items-center gap-3">
            <svg
                className={`w-8 h-8 animate-spin ${color}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            {message && <p className={`text-sm ${textColor}`}>{message}</p>}
        </div>
    );
}
