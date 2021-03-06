package com.hyhl.common.validator.custom;

import static java.lang.annotation.ElementType.ANNOTATION_TYPE;
import static java.lang.annotation.ElementType.CONSTRUCTOR;
import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.ElementType.METHOD;
import static java.lang.annotation.ElementType.PARAMETER;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import javax.validation.Constraint;
import javax.validation.Payload;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Pattern.Flag;

import org.hibernate.validator.constraints.NotBlank;

import com.hyhl.common.validator.constant.ConstantRegex;

/**
 * 密码验证注解
 */
@Constraint(validatedBy = { })
@Pattern(regexp=ConstantRegex.PASSWORD,message=ConstantRegex.PASSWORD_MSG)
@Target({ METHOD, FIELD, ANNOTATION_TYPE, CONSTRUCTOR, PARAMETER })
@Retention(RUNTIME)
@Documented
@NotBlank(message="密码不能为空")
public @interface Password {
	String message() default ConstantRegex.PASSWORD_MSG;
	
	String regexp() default ConstantRegex.PASSWORD;

	Flag[] flags() default { };

	Class<?>[] groups() default { };

	Class<? extends Payload>[] payload() default { };
}
