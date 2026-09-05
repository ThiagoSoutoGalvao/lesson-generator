<button {{ $attributes->merge(['type' => 'submit', 'class' => 'inline-flex items-center px-4 py-2 bg-[#e0521f] border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-[#c9461a] focus:bg-[#c9461a] active:bg-[#b03e17] focus:outline-none focus:ring-2 focus:ring-[#fc6840] focus:ring-offset-2 transition ease-in-out duration-150']) }}>
    {{ $slot }}
</button>
