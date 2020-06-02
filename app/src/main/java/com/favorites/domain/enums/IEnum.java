package com.favorites.domain.enums;

import java.util.Optional;

public interface IEnum<T extends IEnum<T>> {

	public String getCode();
	
	public String getName();
	
	public T[] datas();
	
	default public Optional<T> from(String code) {
		for(T t: datas()) {
			if (t.getCode().equals(code)) {
				return Optional.of(t);
			}
		}
		
		return Optional.empty();
	}
}
