<button {{ $attributes->merge(['type' => 'submit', 'class' => 'inline-flex items-center px-4 py-2 bg-[#a01789] border border-transparent rounded-lg font-semibold text-xs text-white uppercase tracking-widest hover:bg-[#8a1475] focus:bg-[#8a1475] active:bg-[#7a1268] focus:outline-none focus:ring-2 focus:ring-[#fc6840] focus:ring-offset-2 transition ease-in-out duration-150']) }}>
    {{ $slot }}
</button>
